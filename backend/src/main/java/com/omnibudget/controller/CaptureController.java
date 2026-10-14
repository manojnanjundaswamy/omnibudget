package com.omnibudget.controller;

import com.omnibudget.domain.CapturedItem;
import com.omnibudget.dto.AddCapturedItemRequest;
import com.omnibudget.dto.CaptureViewDto;
import com.omnibudget.dto.PasteCaptureRequest;
import com.omnibudget.dto.PasteCaptureResponse;
import com.omnibudget.service.CaptureService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/capture")
@RequiredArgsConstructor
@Slf4j
public class CaptureController {

    private final CaptureService captureService;

    @GetMapping
    public ResponseEntity<CaptureViewDto> getView(
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return ResponseEntity.ok(captureService.getView(userId));
    }

    @GetMapping("/count")
    public ResponseEntity<Map<String, Long>> getPendingCount(
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return ResponseEntity.ok(Map.of("pending", captureService.getPendingCount(userId)));
    }

    @PostMapping("/address/reset")
    public ResponseEntity<CaptureViewDto> resetAddress(
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return ResponseEntity.ok(captureService.resetAddress(userId));
    }

    @PostMapping("/paste")
    public ResponseEntity<PasteCaptureResponse> paste(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestBody PasteCaptureRequest req) {
        String source = req != null && req.getSource() != null ? req.getSource() : "PASTE";
        String text = req != null ? req.getText() : "";
        return ResponseEntity.ok(captureService.paste(userId, text, source));
    }

    @PostMapping("/items/{id}/add")
    public ResponseEntity<CapturedItem> add(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @PathVariable UUID id,
            @RequestBody(required = false) AddCapturedItemRequest req) {
        if (req == null) {
            req = new AddCapturedItemRequest();
        }
        return ResponseEntity.ok(captureService.add(userId, id, req));
    }

    @PostMapping("/items/{id}/dismiss")
    public ResponseEntity<CapturedItem> dismiss(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @PathVariable UUID id) {
        return ResponseEntity.ok(captureService.dismiss(userId, id));
    }

    /**
     * Inbound email webhook endpoint: can be triggered by Cloudflare Email Workers, Sendgrid,
     * Mailgun, AWS SES, or direct POST.
     */
    @PostMapping("/inbound")
    public ResponseEntity<Map<String, Object>> inboundEmail(
            @RequestHeader(value = "X-Envelope-To", required = false) String headerTo,
            @RequestHeader(value = "X-Sender", required = false) String headerSender,
            @RequestBody(required = false) Map<String, Object> body) {

        String envelopeTo = headerTo;
        String rawText = "";
        String from = headerSender;
        String subject = "";

        if (body != null) {
            if (body.containsKey("envelopeTo") && body.get("envelopeTo") != null) {
                envelopeTo = body.get("envelopeTo").toString();
            } else if (body.containsKey("to") && body.get("to") != null) {
                envelopeTo = body.get("to").toString();
            }
            if (body.containsKey("from") && body.get("from") != null) {
                from = body.get("from").toString();
            }
            if (body.containsKey("subject") && body.get("subject") != null) {
                subject = body.get("subject").toString();
            }
            if (body.containsKey("text") && body.get("text") != null) {
                rawText = body.get("text").toString();
            } else if (body.containsKey("body") && body.get("body") != null) {
                rawText = body.get("body").toString();
            } else if (body.containsKey("raw") && body.get("raw") != null) {
                rawText = body.get("raw").toString();
            }
        }

        Map<String, Object> result = captureService.processInboundEmail(envelopeTo, rawText, from, subject);
        return ResponseEntity.ok(result);
    }
}
