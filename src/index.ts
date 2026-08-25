export type SystemStatus = "online" | "offline" | "maintenance";

export interface SystemInstance {
  id: string;
  name: string;
  type: string;
  status: SystemStatus;
  lastHeartbeat: number;
}

export interface WorkflowStep {
  id: string;
  action: string;
  target: string;
  parameters?: Record<string, string | number | boolean>;
}

export interface WorkflowManifest {
  id: string;
  steps: WorkflowStep[];
}

export interface WorkflowPlan {
  manifestId: string;
  executable: false;
  validatedSteps: WorkflowStep[];
  unavailableTargets: string[];
}

const ID_PATTERN = /^[A-Za-z0-9._-]{1,128}$/;
const MAX_SYSTEMS = 1000;
const MAX_STEPS = 100;

function requireId(value: string, label: string): string {
  if (!ID_PATTERN.test(value)) throw new Error(`${label} must match ${ID_PATTERN}`);
  return value;
}

export class WorkflowPlanner {
  private readonly systems = new Map<string, SystemInstance>();

  registerSystem(system: SystemInstance): void {
    requireId(system.id, "system id");
    if (!system.name.trim() || system.name.length > 200) throw new Error("system name must contain 1-200 characters");
    if (!system.type.trim() || system.type.length > 100) throw new Error("system type must contain 1-100 characters");
    if (!Number.isFinite(system.lastHeartbeat) || system.lastHeartbeat < 0) throw new Error("lastHeartbeat must be non-negative");
    if (!this.systems.has(system.id) && this.systems.size >= MAX_SYSTEMS) throw new Error("system capacity reached");
    this.systems.set(system.id, { ...system });
  }

  plan(manifest: WorkflowManifest): WorkflowPlan {
    requireId(manifest.id, "manifest id");
    if (manifest.steps.length < 1 || manifest.steps.length > MAX_STEPS) {
      throw new Error("workflow must contain between 1 and 100 steps");
    }

    const seen = new Set<string>();
    const validatedSteps = manifest.steps.map((step) => {
      requireId(step.id, "step id");
      if (seen.has(step.id)) throw new Error(`duplicate step id: ${step.id}`);
      seen.add(step.id);
      if (!step.action.trim() || step.action.length > 100) throw new Error("action must contain 1-100 characters");
      requireId(step.target, "target");
      const parameters = step.parameters ?? {};
      if (Object.keys(parameters).length > 50) throw new Error("step parameter limit exceeded");
      return { ...step, parameters: { ...parameters } };
    });

    const unavailableTargets = [...new Set(validatedSteps
      .map((step) => step.target)
      .filter((target) => this.systems.get(target)?.status !== "online"))].sort();

    return {
      manifestId: manifest.id,
      executable: false,
      validatedSteps,
      unavailableTargets,
    };
  }

  status(): { total: number; online: number; systems: SystemInstance[] } {
    const systems = [...this.systems.values()].map((system) => ({ ...system })).sort((a, b) => a.id.localeCompare(b.id));
    return { total: systems.length, online: systems.filter((system) => system.status === "online").length, systems };
  }
}

export default WorkflowPlanner;
