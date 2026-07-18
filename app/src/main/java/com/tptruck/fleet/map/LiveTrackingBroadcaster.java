package com.tptruck.fleet.map;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
public class LiveTrackingBroadcaster {

    public static final String TOPIC_FLEET_LIVE = "/topic/fleet/live";

    private final SimpMessagingTemplate messagingTemplate;

    public LiveTrackingBroadcaster(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void broadcast(LivePositionUpdate update) {
        messagingTemplate.convertAndSend(TOPIC_FLEET_LIVE, update);
    }
}
