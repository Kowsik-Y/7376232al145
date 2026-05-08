type StackType = "backend" | "frontend";
type LevelType = "debug" | "info" | "warn" | "error" | "fatal";
type PackageType =
    | "cache" | "controller" | "cron_job" | "db" | "domain" | "handler" | "repository" | "route" | "service"
    | "api" | "component" | "hook" | "page" | "state" | "style"
    | "auth" | "config" | "middleware" | "utils";

const EXTERNAL_LOG_URL = `${process.env.EVALUATION_URL}/evaluation-service/logs`;

export async function Log(
    stack: StackType,
    level: LevelType,
    pkg: PackageType,
    message: string
): Promise<void> {
    const payload = { stack, level, package: pkg, message };


    const response = await fetch(EXTERNAL_LOG_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.EVALUATION_AUTH_TOKEN}`,
        },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        void response.text();
    }

}
