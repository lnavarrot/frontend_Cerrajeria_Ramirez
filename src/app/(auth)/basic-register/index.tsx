import PageMeta from '@/components/PageMeta';
import { Link, useNavigate } from 'react-router';
import { useState, type FormEvent } from 'react';
import { authService } from '@/services/authService';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const change = (key: keyof typeof form, value: string) => setForm(prev => ({ ...prev, [key]: value }));
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError('');
    if (form.password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.');
    if (form.password !== form.confirm) return setError('Las contraseñas no coinciden.');
    setLoading(true);
    try {
      await authService.register({ firstName: form.firstName, lastName: form.lastName, email: form.email, phone: form.phone, password: form.password });
      navigate('/client-dashboard');
    } catch (err) {
      setError((err as {response?:{data?:{message?:string}}}).response?.data?.message ?? 'No fue posible crear la cuenta.');
    } finally { setLoading(false); }
  };
  return <>
    <PageMeta title="Crear cuenta de cliente" />
    <div className="relative min-h-screen w-full flex justify-center items-center py-10 px-4">
      <div className="card w-full max-w-xl z-10"><div className="px-8 py-10">
        <div className="text-center"><div className="text-xl font-bold text-primary">CERRAJERÍA RAMÍREZ, S.A.</div>
          <h1 className="mt-7 text-2xl font-semibold">Crear cuenta de cliente</h1>
          <p className="mt-2 text-default-500">Regístrate para crear tickets y consultar el seguimiento de tus servicios.</p></div>
        <form onSubmit={submit} className="mt-8 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium">Nombres<input required className="form-input mt-2" value={form.firstName} onChange={e=>change('firstName',e.target.value)} placeholder="Nombres" /></label>
          <label className="text-sm font-medium">Apellidos<input required className="form-input mt-2" value={form.lastName} onChange={e=>change('lastName',e.target.value)} placeholder="Apellidos" /></label>
          <label className="text-sm font-medium sm:col-span-2">Correo electrónico<input required type="email" className="form-input mt-2" value={form.email} onChange={e=>change('email',e.target.value)} placeholder="correo@ejemplo.com" /></label>
          <label className="text-sm font-medium sm:col-span-2">Teléfono<input className="form-input mt-2" value={form.phone} onChange={e=>change('phone',e.target.value)} placeholder="Teléfono de contacto" /></label>
          <label className="text-sm font-medium">Contraseña<input required type="password" className="form-input mt-2" value={form.password} onChange={e=>change('password',e.target.value)} placeholder="Mínimo 8 caracteres" /></label>
          <label className="text-sm font-medium">Confirmar contraseña<input required type="password" className="form-input mt-2" value={form.confirm} onChange={e=>change('confirm',e.target.value)} placeholder="Repite la contraseña" /></label>
          {error && <div className="sm:col-span-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          <button disabled={loading} className="btn bg-primary text-white sm:col-span-2 disabled:opacity-60">{loading?'Creando cuenta...':'Crear mi cuenta'}</button>
        </form>
        <p className="mt-6 text-center text-sm text-default-500">¿Ya tienes una cuenta? <Link to="/basic-login" className="font-semibold text-primary underline">Iniciar sesión</Link></p>
      </div></div>
    </div>
  </>;
}
