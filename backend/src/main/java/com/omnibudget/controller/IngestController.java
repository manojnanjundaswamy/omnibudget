package com.omnibudget.controller;

import com.omnibudget.domain.Transaction;
import com.omnibudget.dto.IngestCommitRequest;
import com.omnibudget.dto.ParsedTransactionDto;
import com.omnibudget.dto.SmartClipRequest;
import com.omnibudget.service.IngestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ingest")
@RequiredArgsConstructor
public class IngestController {

    private final IngestService ingestService;

    @PostMapping("/statement-preview")
    public ResponseEntity<List<ParsedTransactionDto>> previewStatementText(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestBody String rawText) {
        return ResponseEntity.ok(ingestService.parseStatementText(rawText, userId));
    }

    @PostMapping("/ofx-preview")
    public ResponseEntity<List<ParsedTransactionDto>> previewOfx(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestBody String ofxContent) {
        return ResponseEntity.ok(ingestService.parseOfxContent(ofxContent, userId));
    }

    @PostMapping("/smart-clip")
    public ResponseEntity<Transaction> ingestSmartClip(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestBody SmartClipRequest req) {
        return ResponseEntity.ok(ingestService.processSmartClip(userId, req));
    }

    @PostMapping("/commit")
    public ResponseEntity<Map<String, Object>> commitTransactions(
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestBody IngestCommitRequest req) {
        return ResponseEntity.ok(ingestService.commitParsedTransactions(userId, req.getAccountId(), req.getTransactions()));
    }
}
