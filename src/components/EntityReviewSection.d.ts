import { ReactNode } from 'react';

export interface EntityReviewSectionProps {
  title: string;
  singularLabel: string;
  entities: any[];
  selected: Set<number>;
  onAdd: () => void;
  onToggle: (type: string, index: number) => void;
  onUpdate: (type: string, index: number, field: string, value: any) => void;
  onRemove: (type: string, index: number) => void;
  entityType: string;
  renderFields: (entity: any, index: number) => ReactNode;
}

export default function EntityReviewSection(props: EntityReviewSectionProps): JSX.Element;
