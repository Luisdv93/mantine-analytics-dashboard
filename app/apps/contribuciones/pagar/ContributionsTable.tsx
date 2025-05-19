'use client';

import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';

import {
  Badge,
  Button,
  Group,
  MantineColor,
  MultiSelect,
  Popover,
  Progress,
  Table,
  TextInput,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconSearch } from '@tabler/icons-react';
import sortBy from 'lodash/sortBy';
import {
  DataTable,
  DataTableProps,
  DataTableSortStatus,
} from 'mantine-datatable';

import { ErrorAlert } from '@/components';

import { Contribution, ContributionStatus } from './types';

type StatusBadgeProps = {
  status: ContributionStatus;
};

const StatusBadge = ({ status }: StatusBadgeProps) => {
  let color: MantineColor = '';
  let text: string = '';

  switch (status) {
    case 'searched':
      color = 'orange';
      text = 'Buscado';
      break;
    case 'pending':
      color = 'blue';
      text = 'Pendiente';
      break;
    case 'paid':
      color = 'green';
      text = 'Pagado';
      break;
    default:
      color = 'gray';
      text = 'Sin estado';
  }

  return (
    <Badge color={color} variant="filled" radius="sm">
      {text}
    </Badge>
  );
};

const PAGE_SIZES = [5, 10, 20];

type ContributionsTableProps = {
  data: Contribution[];
  error?: ReactNode;
  loading?: boolean;
};

// Extracted popover button for properties count
const PropertiesPopoverButton = ({ count }: { count: number }) => {
  const [opened, setOpened] = useState(false);
  // Example data for the popover table, you can replace this with real data if available
  const exampleProperties = [
    { propiedad: 'Prop 1', valor: 'Valor 1', detalle: 'Detalle 1' },
    { propiedad: 'Prop 2', valor: 'Valor 2', detalle: 'Detalle 2' },
    { propiedad: 'Prop 3', valor: 'Valor 3', detalle: 'Detalle 3' },
  ];
  return (
    <Popover opened={opened} onChange={setOpened} position="bottom" shadow="md">
      <Popover.Target>
        <Button variant="light" size="xs" onClick={() => setOpened((o) => !o)}>
          {count}
        </Button>
      </Popover.Target>
      <Popover.Dropdown>
        <Table striped withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Propiedad</Table.Th>
              <Table.Th>Valor</Table.Th>
              <Table.Th>Detalle</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {exampleProperties.map((prop, idx) => (
              <Table.Tr key={idx}>
                <Table.Td>{prop.propiedad}</Table.Td>
                <Table.Td>{prop.valor}</Table.Td>
                <Table.Td>{prop.detalle}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Popover.Dropdown>
    </Popover>
  );
};

// Progress button for 'Buscar deuda'
const BuscarDeudaButton = () => {
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (running) {
      setProgress(0);
      setDone(false);
      intervalRef.current = setInterval(() => {
        setProgress((old) => {
          if (old >= 100) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setRunning(false);
            setDone(true);
            return 100;
          }
          return old + 2;
        });
      }, 100);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const handleClick = () => {
    setProgress(0);
    setDone(false);
    setRunning(true);
  };

  let buttonText = 'Buscar deuda';
  if (running) {
    buttonText = `${progress}`;
  } else if (done) {
    buttonText = 'Deuda calculada';
  }

  return (
    <Button
      size="sm"
      onClick={handleClick}
      disabled={running || done}
      variant={done ? 'filled' : 'default'}
      color={done ? 'green' : undefined}
    >
      {buttonText}
    </Button>
  );
};

const ContributionsTable = (props: ContributionsTableProps) => {
  const { data, loading, error } = props;

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
  const [selectedRecords, setSelectedRecords] = useState<Contribution[]>([]);
  const [records, setRecords] = useState<Contribution[]>(
    data.slice(0, pageSize),
  );
  const [sortStatus, setSortStatus] = useState<
    DataTableSortStatus<Contribution>
  >({
    columnAccessor: 'name',
    direction: 'asc',
  });
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebouncedValue(query, 200);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const statuses = useMemo(() => {
    const statuses = new Set(data.map((e) => e.status));
    return Array.from(statuses);
  }, [data]);

  const columns: DataTableProps<Contribution>['columns'] = [
    {
      accessor: 'id',
      render: (item: Contribution) => (
        <span>{String(item.id).slice(0, 7)}</span>
      ),
    },
    {
      accessor: 'name',
      title: 'Nombre',
      sortable: true,
      filter: (
        <TextInput
          label="Contributions"
          description="Show contributions whose names include the specified text"
          placeholder="Search contributions..."
          leftSection={<IconSearch size={16} />}
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
        />
      ),
      filtering: query !== '',
    },
    {
      accessor: 'description',
      title: 'Descripción',
      render: (item: Contribution) => <span>{item.description}</span>,
    },
    {
      accessor: 'propertiesCount',
      title: 'Numero de propiedades',
      sortable: true,
      render: (item: Contribution) => (
        <PropertiesPopoverButton count={item.propertiesCount} />
      ),
    },
    {
      accessor: 'status',
      title: 'Estado',
      render: (item: Contribution) => <StatusBadge status={item.status} />,
      filter: (
        <MultiSelect
          label="Estado"
          description="Mostrar todas las contribuciones con estado"
          data={statuses}
          value={selectedStatuses}
          placeholder="Buscar estado…"
          onChange={setSelectedStatuses}
          leftSection={<IconSearch size={16} />}
          clearable
          searchable
        />
      ),
      filtering: selectedStatuses.length > 0,
    },
    {
      accessor: 'buscarDeuda',
      title: 'Buscar deuda',
      render: () => <BuscarDeudaButton />,
    },
    {
      accessor: 'acciones',
      title: 'Acciones',
      render: () => (
        <Button size="sm" variant="outline">
          Detalle de la deuda
        </Button>
      ),
    },
  ];

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  useEffect(() => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize;

    // Filter first, then sort, then slice
    let filtered = data;

    if (debouncedQuery || selectedStatuses.length) {
      filtered = data.filter(({ name, status }) => {
        if (
          debouncedQuery !== '' &&
          !name.toLowerCase().includes(debouncedQuery.trim().toLowerCase())
        ) {
          return false;
        }
        if (
          selectedStatuses.length &&
          !selectedStatuses.some((s) => s === status)
        ) {
          return false;
        }
        return true;
      });
    }

    // Sort the filtered data
    let sorted = sortBy(filtered, sortStatus.columnAccessor) as Contribution[];
    if (sortStatus.direction === 'desc') {
      sorted = sorted.reverse();
    }

    // Paginate
    const paginated = sorted.slice(from, to);

    setRecords(paginated);
  }, [sortStatus, data, page, pageSize, debouncedQuery, selectedStatuses]);

  return error ? (
    <ErrorAlert
      title="Error loading Contributions"
      message={error.toString()}
    />
  ) : (
    <DataTable<Contribution>
      minHeight={200}
      verticalSpacing="sm"
      striped={true}
      columns={columns}
      records={records}
      selectedRecords={selectedRecords}
      onSelectedRecordsChange={setSelectedRecords}
      totalRecords={
        debouncedQuery || selectedStatuses.length > 0
          ? records.length
          : data.length
      }
      recordsPerPage={pageSize}
      page={page}
      onPageChange={(p) => setPage(p)}
      recordsPerPageOptions={PAGE_SIZES}
      onRecordsPerPageChange={setPageSize}
      sortStatus={sortStatus}
      onSortStatusChange={setSortStatus}
      fetching={loading}
    />
  );
};

export default ContributionsTable;
