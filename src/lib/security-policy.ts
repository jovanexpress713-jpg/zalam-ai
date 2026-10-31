/**
 * ZALAM AI assessment policy.
 *
 * This module is deliberately fail-closed. It authorizes only explicitly
 * scoped, non-destructive assessment actions. It does not provide stealth,
 * persistence, credential theft, exploitation, or arbitrary command execution.
 */

export type AssessmentDomain =
  | "web"
  | "api"
  | "network_inventory"
  | "wifi_configuration"
  | "android_static"
  | "ios_static"
  | "financial_sandbox"
  | "ai_security";

export type AssessmentAction =
  | "http_headers"
  | "tls_configuration"
  | "dns_inventory"
  | "service_inventory"
  | "openapi_review"
  | "static_artifact_review"
  | "sandbox_business_logic"
  | "prompt_injection_review";

export type EngagementScope = {
  engagementId: string;
  organization: string;
  authorizedBy: string;
  startsAt: string;
  endsAt: string;
  approved: boolean;
  domains: AssessmentDomain[];
  allowedHosts: string[];
  allowedActions: AssessmentAction[];
  maxRequestsPerMinute: number;
};

export type PolicyDecision =
  | { allowed: true; engagementId: string; reason: "WITHIN_APPROVED_SCOPE" }
  | {
      allowed: false;
      reason:
        | "INVALID_SCOPE"
        | "NOT_APPROVED"
        | "OUTSIDE_TIME_WINDOW"
        | "DOMAIN_NOT_ALLOWED"
        | "ACTION_NOT_ALLOWED"
        | "HOST_NOT_ALLOWED"
        | "UNSAFE_RATE_LIMIT";
    };

const HOST_PATTERN =
  /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

export function evaluateAssessmentPolicy(input: {
  scope: EngagementScope;
  domain: AssessmentDomain;
  action: AssessmentAction;
  host: string;
  now?: Date;
}): PolicyDecision {
  const { scope, domain, action } = input;
  const now = input.now ?? new Date();

  if (
    !scope.engagementId.trim() ||
    !scope.organization.trim() ||
    !scope.authorizedBy.trim() ||
    !Number.isFinite(Date.parse(scope.startsAt)) ||
    !Number.isFinite(Date.parse(scope.endsAt)) ||
    Date.parse(scope.endsAt) <= Date.parse(scope.startsAt) ||
    !Array.isArray(scope.domains) ||
    !Array.isArray(scope.allowedHosts) ||
    !Array.isArray(scope.allowedActions)
  ) {
    return { allowed: false, reason: "INVALID_SCOPE" };
  }

  if (!scope.approved) return { allowed: false, reason: "NOT_APPROVED" };

  if (now.getTime() < Date.parse(scope.startsAt) || now.getTime() > Date.parse(scope.endsAt)) {
    return { allowed: false, reason: "OUTSIDE_TIME_WINDOW" };
  }

  if (!Number.isInteger(scope.maxRequestsPerMinute) ||
      scope.maxRequestsPerMinute < 1 ||
      scope.maxRequestsPerMinute > 60) {
    return { allowed: false, reason: "UNSAFE_RATE_LIMIT" };
  }

  if (!scope.domains.includes(domain)) {
    return { allowed: false, reason: "DOMAIN_NOT_ALLOWED" };
  }

  if (!scope.allowedActions.includes(action)) {
    return { allowed: false, reason: "ACTION_NOT_ALLOWED" };
  }

  const host = input.host.trim().toLowerCase().replace(/\.$/, "");
  if (!HOST_PATTERN.test(host) || !scope.allowedHosts.some(
    (allowed) => allowed.trim().toLowerCase().replace(/\.$/, "") === host
  )) {
    return { allowed: false, reason: "HOST_NOT_ALLOWED" };
  }

  return {
    allowed: true,
    engagementId: scope.engagementId,
    reason: "WITHIN_APPROVED_SCOPE"
  };
}

/**
 * Bounded autonomous improvement gate.
 *
 * Routine changes may be applied without per-change user approval only when
 * every test passes and every changed file is inside the low-risk allowlist.
 * Security policy, authentication, secrets, deployment workflows and scope
 * controls are deliberately excluded from unattended modification.
 */
export type ImprovementProposal = {
  id: string;
  title: string;
  rationale: string;
  changedFiles: string[];
  tests: { name: string; passed: boolean }[];
  status: "proposed" | "tested" | "rejected";
};

const AUTONOMOUS_CHANGE_PREFIXES = ["src/components/", "src/lib/", "docs/"];
const PROTECTED_PATH_PARTS = [
  ".env", "secret", "auth", "security", "policy", "permission",
  ".github/workflows/", "package-lock", "pnpm-lock", "yarn.lock"
];

export function canApplyImprovement(proposal: ImprovementProposal): boolean {
  const safeFiles = proposal.changedFiles.length > 0 &&
    proposal.changedFiles.every((rawPath) => {
      const file = rawPath.replace(/\\\\/g, "/").toLowerCase();
      const parts = file.split("/");
      return !file.startsWith("/") &&
        !parts.includes("..") &&
        AUTONOMOUS_CHANGE_PREFIXES.some((prefix) => file.startsWith(prefix)) &&
        !PROTECTED_PATH_PARTS.some((part) => file.includes(part));
    });

  return proposal.status !== "rejected" &&
    safeFiles &&
    proposal.tests.length > 0 &&
    proposal.tests.every((test) => test.passed);
}
