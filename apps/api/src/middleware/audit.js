export function auditEvent(eventName) {
  return (req, res, next) => {
    const startedAt = Date.now();

    res.on("finish", () => {
      console.info(
        JSON.stringify({
          event: eventName,
          method: req.method,
          path: req.originalUrl,
          statusCode: res.statusCode,
          userId: req.user?.sub ?? null,
          durationMs: Date.now() - startedAt,
          timestamp: new Date().toISOString()
        })
      );
    });

    next();
  };
}
