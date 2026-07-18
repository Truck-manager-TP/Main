package com.tptruck.fleet.config;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.concurrent.atomic.AtomicInteger;

@Component
public class WebSocketMetrics {

    private final AtomicInteger activeConnections = new AtomicInteger();
    private final Counter disconnectCounter;

    public WebSocketMetrics(MeterRegistry meterRegistry) {
        Gauge.builder("map.websocket.connections.active", activeConnections, AtomicInteger::get)
                .description("Active admin WebSocket connections for live map tracking")
                .register(meterRegistry);
        disconnectCounter = meterRegistry.counter("map.websocket.disconnections", "reason", "client");
    }

    @EventListener
    public void onConnect(SessionConnectEvent event) {
        activeConnections.incrementAndGet();
    }

    @EventListener
    public void onDisconnect(SessionDisconnectEvent event) {
        activeConnections.updateAndGet(current -> Math.max(0, current - 1));
        disconnectCounter.increment();
    }
}
