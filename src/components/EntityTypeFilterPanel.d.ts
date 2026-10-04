interface EntityTypeFilters {
  place: boolean;
  person: boolean;
  event: boolean;
  theory: boolean;
  artifact: boolean;
}

export interface EntityTypeFilterPanelProps {
  filters: EntityTypeFilters;
  onFilterChange: (type: string, checked: boolean) => void;
}

export default function EntityTypeFilterPanel(props: EntityTypeFilterPanelProps): JSX.Element;
