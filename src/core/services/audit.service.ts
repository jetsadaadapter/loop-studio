import { AuditEventSchema, type AuditEvent } from "@/core/validators/install.validator";

/**
 * Persists a security-relevant audit event.
 * Redacts sensitive values before logging.
 * Replace the console stub with your structured logging / DB write.
 */
export async function recordAuditEvent(raw: AuditEvent): Promise<void> {
    const event = AuditEventSchema.parse(raw);

    // Redact sensitive metadata values before logging
    const safeMetadata = event.metadata
        ? Object.fromEntries(
            Object.entries(event.metadata).map(([k]) => [k, "[REDACTED]"])
        )
        : undefined;

    const logEntry = { ...event, metadata: safeMetadata };

    // TODO: Replace with structured logging sink (e.g. Datadog, CloudWatch)
    console.log("[AUDIT]", JSON.stringify(logEntry));
}
