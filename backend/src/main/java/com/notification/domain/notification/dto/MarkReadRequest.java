package com.notification.domain.notification.dto;

public class MarkReadRequest {
    private Long id;
    private String message;

    public MarkReadRequest() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public static class MarkReadRequestBuilder {
        private Long id;
        private String message;

        public MarkReadRequestBuilder id(Long id) { this.id = id; return this; }
        public MarkReadRequestBuilder message(String message) { this.message = message; return this; }

        public MarkReadRequest build() {
            MarkReadRequest r = new MarkReadRequest();
            r.id = this.id;
            r.message = this.message;
            return r;
        }
    }

    public static MarkReadRequestBuilder builder() {
        return new MarkReadRequestBuilder();
    }
}
