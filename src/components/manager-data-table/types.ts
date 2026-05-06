import type { ReactNode } from "react";

export type ManagerTableColumn<T> = {
    key: string;
    header: string;
    className?: string;
    render: (row: T) => ReactNode;
};
