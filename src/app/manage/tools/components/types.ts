// Local form state types for the tool create/edit drawer

export interface ParamDraft {
  _localId: string;
  id?: string;
  key: string;
  label: string;
  type: string;
  required: boolean;
  sortOrder: number;
  defaultValue: string;
  placeholder: string;
  transform?: string | null;
  options?: string[];
  configModel: string;
  configPrompt: string;
  configPromptId?: string;
  configPromptName?: string;
}

export interface ScriptDraft {
  _localId: string;
  id?: string;
  plugin: string;
  label: string;
  description: string;
  sortOrder: number;
  config: Record<string, unknown>;
}

export type ToolFormMode = "create" | "edit";

