import type { ReactNode } from "react";

export type ManagerFormProps = {
    title: string;
    description?: string;
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
    actions: ReactNode;
    children: ReactNode;
};
