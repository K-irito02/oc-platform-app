package com.ocplatform.common.event;

import org.springframework.context.ApplicationEvent;

public class MaintenanceCacheClearEvent extends ApplicationEvent {
    public MaintenanceCacheClearEvent(Object source) {
        super(source);
    }
}
