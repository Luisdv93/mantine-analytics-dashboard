export interface Contribution {
  description: string;
  id: number;
  name: string;
  propertiesCount: number;
  status: ContributionStatus;
}

export type ContributionStatus = 'pending' | 'searched' | 'paid';
