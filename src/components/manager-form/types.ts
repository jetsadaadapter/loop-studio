import type { ReactNode } from "react";

export type ManagerFormProps = {
    title: string;
    description?: string;
    onSubmit: NonNullable<React.ComponentProps<"form">["onSubmit"]>;
    actions: ReactNode;
    children: ReactNode;
};
