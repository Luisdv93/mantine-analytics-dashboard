'use client';

import {
  ActionIcon,
  Anchor,
  Container,
  Group,
  Paper,
  PaperProps,
  Stack,
  Text,
} from '@mantine/core';
import { IconDotsVertical } from '@tabler/icons-react';

import { PageHeader } from '@/components';
import { useFetchData } from '@/hooks';
import { PATH_DASHBOARD } from '@/routes';

import ContributionsTable from './ContributionsTable';

const items = [
  { title: 'Dashboard', href: PATH_DASHBOARD.default },
  { title: 'Apps', href: '#' },
  { title: 'Contributions', href: '#' },
].map((item, index) => (
  <Anchor href={item.href} key={index}>
    {item.title}
  </Anchor>
));

const PAPER_PROPS: PaperProps = {
  p: 'md',
  shadow: 'md',
  radius: 'md',
};

function Page() {
  const {
    data: contributionsData,
    loading: contributionsLoading,
    error: contributionsError,
  } = useFetchData('/mocks/Contributions.json');

  return (
    <>
      <>
        <title>Apropia - Contribuciones</title>
        <meta
          name="description"
          content="Explore our versatile dashboard website template featuring a stunning array of themes and meticulously crafted components. Elevate your web project with seamless integration, customizable themes, and a rich variety of components for a dynamic user experience. Effortlessly bring your data to life with our intuitive dashboard template, designed to streamline development and captivate users. Discover endless possibilities in design and functionality today!"
        />
      </>
      <Container fluid>
        <Stack gap="lg">
          <PageHeader title="Orders" breadcrumbItems={items} />
          <Paper {...PAPER_PROPS}>
            <Group justify="space-between" mb="md">
              <Text fz="lg" fw={600}>
                Contribuciones
              </Text>
              <ActionIcon>
                <IconDotsVertical size={18} />
              </ActionIcon>
            </Group>
            <ContributionsTable
              data={contributionsData}
              error={contributionsError}
              loading={contributionsLoading}
            />
          </Paper>
        </Stack>
      </Container>
    </>
  );
}

export default Page;
