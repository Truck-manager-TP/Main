package com.tptruck.fleet.map;

import com.tptruck.fleet.route.Route;
import com.tptruck.fleet.route.RouteRepository;
import com.tptruck.fleet.route.RouteScope;
import com.tptruck.fleet.route.RouteStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TrackingServiceTest {

    @Mock
    private RouteRepository routeRepository;
    @Mock
    private TruckLocationRepository truckLocationRepository;
    @Mock
    private RouteTrajectoryPointRepository trajectoryPointRepository;
    @Mock
    private RelayPointRepository relayPointRepository;
    @Mock
    private LiveTrackingBroadcaster broadcaster;

    @InjectMocks
    private TrackingService trackingService;

    private Route route;

    @BeforeEach
    void setUp() {
        route = new Route("Casablanca", "Tanger", RouteScope.DOMESTIC, 340.0);
        route.updatePosition(33.57, -7.59);
    }

    @Test
    void ingestPositionPersistsLocationAndBroadcasts() {
        when(routeRepository.findById(1L)).thenReturn(Optional.of(route));
        when(routeRepository.save(any(Route.class))).thenAnswer(inv -> inv.getArgument(0));
        when(trajectoryPointRepository.findByRouteIdAndPointTypeOrderBySeqAsc(1L, TrajectoryPointType.ACTUAL))
                .thenReturn(List.of());

        Route updated = trackingService.ingestPosition(1L, new PositionIngestRequest(34.0, -6.8, 80.0, (short) 45));

        assertEquals(RouteStatus.IN_TRANSIT, updated.getStatus());
        verify(truckLocationRepository).save(any(TruckLocation.class));
        verify(trajectoryPointRepository).save(any(RouteTrajectoryPoint.class));
        verify(broadcaster).broadcast(any(LivePositionUpdate.class));
    }

    @Test
    void ingestPositionRejectsInvalidCoordinates() {
        assertThrows(IllegalArgumentException.class,
                () -> trackingService.ingestPosition(1L, new PositionIngestRequest(999, 0, null, null)));
        verifyNoInteractions(routeRepository);
    }

    @Test
    void liveFleetReturnsInTransitTrucksWithCoordinates() {
        route.markInTransit();
        when(routeRepository.findByStatus(RouteStatus.IN_TRANSIT)).thenReturn(List.of(route));

        List<LiveTruckView> live = trackingService.liveFleet();

        assertEquals(1, live.size());
        assertEquals(33.57, live.get(0).latitude());
    }
}
