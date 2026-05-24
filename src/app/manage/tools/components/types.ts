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
  configModel: string;
  configPrompt: string;
}

export type ToolFormMode = "create" | "edit";
