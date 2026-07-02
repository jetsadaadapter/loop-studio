import { ParamType } from "../interfaces/tools.interface";

interface ParamTypeFieldConfig {
  type: ParamType;
  label: string;
  hasPlaceholder: boolean;
  hasDefaultValue: boolean;
  defaultValueType: "text" | "number" | "boolean" | "textarea" | "select" | "date" | "json";
  hasOptions?: boolean;
  renderType: "text" | "number" | "boolean" | "select" | "url" | "textarea" | "date" | "json" | "prompt";
  widthClass: string;
}

export const PARAM_TYPE_CONFIGS: Record<ParamType, ParamTypeFieldConfig> = {
  [ParamType.TEXT]: {
    type: ParamType.TEXT,
    label: "Text",
    hasPlaceholder: true,
    hasDefaultValue: true,
    defaultValueType: "text",
    renderType: "text",
    widthClass: "w-full max-w-xl",
  },
  [ParamType.NUMBER]: {
    type: ParamType.NUMBER,
    label: "Number",
    hasPlaceholder: true,
    hasDefaultValue: true,
    defaultValueType: "number",
    renderType: "number",
    widthClass: "w-full max-w-xs",
  },
  [ParamType.BOOLEAN]: {
    type: ParamType.BOOLEAN,
    label: "Boolean",
    hasPlaceholder: false,
    hasDefaultValue: true,
    defaultValueType: "boolean",
    renderType: "boolean",
    widthClass: "w-auto",
  },
  [ParamType.URL]: {
    type: ParamType.URL,
    label: "URL",
    hasPlaceholder: true,
    hasDefaultValue: true,
    defaultValueType: "text",
    renderType: "url",
    widthClass: "w-full",
  },
  [ParamType.SELECT]: {
    type: ParamType.SELECT,
    label: "Select",
    hasPlaceholder: true,
    hasDefaultValue: true,
    defaultValueType: "select",
    hasOptions: true,
    renderType: "select",
    widthClass: "w-full max-w-xs",
  },
  [ParamType.MULTILINE]: {
    type: ParamType.MULTILINE,
    label: "Multiline",
    hasPlaceholder: true,
    hasDefaultValue: true,
    defaultValueType: "textarea",
    renderType: "textarea",
    widthClass: "w-full",
  },
  [ParamType.TEXTAREA]: {
    type: ParamType.TEXTAREA,
    label: "Textarea",
    hasPlaceholder: true,
    hasDefaultValue: true,
    defaultValueType: "textarea",
    renderType: "textarea",
    widthClass: "w-full",
  },
  [ParamType.DATE]: {
    type: ParamType.DATE,
    label: "Date",
    hasPlaceholder: true,
    hasDefaultValue: true,
    defaultValueType: "date",
    renderType: "date",
    widthClass: "w-full max-w-xs",
  },
  [ParamType.JSON]: {
    type: ParamType.JSON,
    label: "JSON",
    hasPlaceholder: true,
    hasDefaultValue: true,
    defaultValueType: "json",
    renderType: "textarea",
    widthClass: "w-full",
  },
  [ParamType.PROMPT]: {
    type: ParamType.PROMPT,
    label: "Prompt (AI)",
    hasPlaceholder: false,
    hasDefaultValue: false,
    defaultValueType: "text",
    renderType: "prompt",
    widthClass: "w-full",
  },
};
