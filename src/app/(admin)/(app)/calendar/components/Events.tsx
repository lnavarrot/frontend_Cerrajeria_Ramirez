import { forwardRef } from 'react';
import { TbCircleFilled } from 'react-icons/tb';

const ExternalEvents = forwardRef<HTMLDivElement>((_, ref) => {
  return (
    <div id="external-events" ref={ref} className="flex flex-col gap-3">
      <p className="text-default-400">Arrastra un evento al calendario o haz clic en una fecha</p>

      <div className="external-event fc-event text-success" data-class="!text-success">
        <TbCircleFilled className="inline-block me-2" /> Nueva planificación
      </div>

      <div className="external-event fc-event text-info" data-class="!text-info">
        <TbCircleFilled className="inline-block me-2" /> Reunión con cliente
      </div>

      <div className="external-event fc-event text-warning" data-class="!text-warning">
        <TbCircleFilled className="inline-block me-2" /> Visita de servicio
      </div>

      <div className="external-event fc-event text-danger" data-class="!text-danger">
        <TbCircleFilled className="inline-block me-2" /> Mantenimiento programado
      </div>

      <div className="flex items-center gap-2">
        <input id="drop-remove" className="form-checkbox" type="checkbox" />
        <label htmlFor="drop-remove" className="align-middle cursor-pointer">
          Eliminar después de colocar
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input id="businessCalendar" className="form-checkbox" type="checkbox" />
        <label htmlFor="businessCalendar" className="align-middle cursor-pointer">
          Horario laboral y semana
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input id="weekNumberCalendar" className="form-checkbox" type="checkbox" />
        <label htmlFor="weekNumberCalendar" className="align-middle cursor-pointer">
          Número de semana
        </label>
      </div>
    </div>
  );
});

ExternalEvents.displayName = 'ExternalEvents';
export default ExternalEvents;
