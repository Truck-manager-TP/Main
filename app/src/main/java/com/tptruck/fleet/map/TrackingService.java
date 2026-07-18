package com.tptruck.fleet.map;

import com.tptruck.fleet.route.Route;
import com.tptruck.fleet.route.RouteRepository;
import com.tptruck.fleet.route.RouteScope;
import com.tptruck.fleet.route.RouteStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class TrackingService {

    private final RouteRepository routeRepository;
    private final TruckLocationRepository truckLocationRepository;
    private final RouteTrajectoryPointRepository trajectoryPointRepository;
    private final RelayPointRepository relayPointRepository;
    private final LiveTrackingBroadcaster broadcaster;

    public TrackingService(
            RouteRepository routeRepository,
            TruckLocationRepository truckLocationRepository,
            RouteTrajectoryPointRepository trajectoryPointRepository,
            RelayPointRepository relayPointRepository,
            LiveTrackingBroadcaster broadcaster) {
        this.routeRepository = routeRepository;
        this.truckLocationRepository = truckLocationRepository;
        this.trajectoryPointRepository = trajectoryPointRepository;
        this.relayPointRepository = relayPointRepository;
        this.broadcaster = broadcaster;
    }

    @Transactional
    public Route ingestPosition(Long routeId, PositionIngestRequest request) {
        validateCoordinates(request.lat(), request.lng());

        Route route = routeRepository.findById(routeId)
                .orElseThrow(() -> new NoSuchElementException("Route not found: " + routeId));

        route.updatePosition(request.lat(), request.lng());
        route.markInTransit();

        TruckLocation location = new TruckLocation(
                routeId,
                route.getTruckId(),
                request.lat(),
                request.lng(),
                request.speedKmh(),
                request.headingDeg());
        truckLocationRepository.save(location);

        appendActualTrajectoryPoint(routeId, request.lat(), request.lng());

        Route saved = routeRepository.save(route);
        broadcaster.broadcast(toLiveUpdate(saved, location.getRecordedAt()));
        return saved;
    }

    @Transactional(readOnly = true)
    public List<LiveTruckView> liveFleet() {
        return routeRepository.findByStatus(RouteStatus.IN_TRANSIT).stream()
                .filter(route -> route.getLastKnownLat() != null && route.getLastKnownLng() != null)
                .map(this::toLiveView)
                .toList();
    }

    @Transactional(readOnly = true)
    public RouteTrajectoryView trajectory(Long routeId) {
        if (!routeRepository.existsById(routeId)) {
            throw new NoSuchElementException("Route not found: " + routeId);
        }
        List<TrajectoryPointView> actual = trajectoryPointRepository
                .findByRouteIdAndPointTypeOrderBySeqAsc(routeId, TrajectoryPointType.ACTUAL)
                .stream()
                .map(p -> new TrajectoryPointView(p.getSeq(), p.getLatitude(), p.getLongitude(), p.getRecordedAt()))
                .toList();
        List<TrajectoryPointView> planned = trajectoryPointRepository
                .findByRouteIdAndPointTypeOrderBySeqAsc(routeId, TrajectoryPointType.PLANNED)
                .stream()
                .map(p -> new TrajectoryPointView(p.getSeq(), p.getLatitude(), p.getLongitude(), p.getRecordedAt()))
                .toList();
        return new RouteTrajectoryView(routeId, actual, planned);
    }

    @Transactional(readOnly = true)
    public List<RelayPointView> relayPoints(RouteScope scope) {
        List<RelayPoint> points;
        if (scope == null) {
            points = relayPointRepository.findByActiveTrueOrderByNameAsc();
        } else {
            String scopeName = scope.name();
            points = relayPointRepository.findByActiveTrueAndScopeInOrderByNameAsc(
                    List.of(scopeName, "BOTH"));
        }
        return points.stream().map(this::toRelayView).toList();
    }

    private void appendActualTrajectoryPoint(Long routeId, double lat, double lng) {
        List<RouteTrajectoryPoint> existing = trajectoryPointRepository
                .findByRouteIdAndPointTypeOrderBySeqAsc(routeId, TrajectoryPointType.ACTUAL);
        int nextSeq = existing.isEmpty() ? 1 : existing.get(existing.size() - 1).getSeq() + 1;
        trajectoryPointRepository.save(new RouteTrajectoryPoint(
                routeId, nextSeq, lat, lng, TrajectoryPointType.ACTUAL, Instant.now()));
    }

    private LiveTruckView toLiveView(Route route) {
        return new LiveTruckView(
                route.getId(),
                route.getTruckId(),
                route.getOrigin(),
                route.getDestination(),
                route.getScope(),
                route.getStatus(),
                route.getLastKnownLat(),
                route.getLastKnownLng(),
                route.getUpdatedAt());
    }

    private LivePositionUpdate toLiveUpdate(Route route, Instant recordedAt) {
        return new LivePositionUpdate(
                route.getId(),
                route.getTruckId(),
                route.getOrigin(),
                route.getDestination(),
                route.getScope(),
                route.getStatus(),
                route.getLastKnownLat(),
                route.getLastKnownLng(),
                recordedAt);
    }

    private RelayPointView toRelayView(RelayPoint point) {
        return new RelayPointView(
                point.getId(),
                point.getCode(),
                point.getName(),
                point.getType(),
                point.getLatitude(),
                point.getLongitude(),
                point.getCountryCode(),
                point.getAddress(),
                point.getScope());
    }

    static void validateCoordinates(double lat, double lng) {
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            throw new IllegalArgumentException("Invalid coordinates: lat=" + lat + ", lng=" + lng);
        }
    }
}
