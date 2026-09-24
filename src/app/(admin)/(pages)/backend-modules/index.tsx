import ApiResourcePage from '@/components/ApiResourcePage';
const definitions = {
  clients: { title: 'Clientes', fields: [{ name: 'name', label: 'Nombre' }, { name: 'tax_id', label: 'NIT' }, { name: 'email', label: 'Email', type: 'email' }, { name: 'phone', label: 'Teléfono' }, { name: 'notes', label: 'Notas' }] },
  branches: { title: 'Sucursales', fields: [{ name: 'client_id', label: 'ID Cliente' }, { name: 'name', label: 'Nombre' }, { name: 'address', label: 'Dirección' }, { name: 'city', label: 'Ciudad' }, { name: 'contact_name', label: 'Contacto' }, { name: 'contact_phone', label: 'Teléfono' }] },
  projects: { title: 'Proyectos', fields: [{ name: 'client_id', label: 'Cliente' }, { name: 'name', label: 'Nombre' }, { name: 'description', label: 'Descripción', required: false }, { name: 'status', label: 'Estado' }] },
  tickets: { title: 'Tickets e incidencias', fields: [{ name: 'client_id', label: 'Cliente' }, { name: 'branch_id', label: 'Sucursal' }, { name: 'project_id', label: 'ID Proyecto', required: false }, { name: 'title', label: 'Título' }, { name: 'description', label: 'Descripción' }, { name: 'work_type', label: 'Tipo de trabajo' }, { name: 'priority', label: 'Prioridad' }, { name: 'status', label: 'Estado', required: false }, { name: 'location', label: 'Ubicación' }, { name: 'required_date', label: 'Fecha requerida', type: 'date' }] },
};
export default function BackendModule({ resource }: { resource: keyof typeof definitions }) { const d = definitions[resource]; return <ApiResourcePage resource={resource} title={d.title} fields={d.fields} />; }
