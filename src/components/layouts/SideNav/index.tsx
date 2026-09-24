import { Link } from 'react-router';
import SimplebarClient from '@/components/client-wrapper/SimplebarClient';
import AppMenu from './AppMenu';
import HoverToggle from './HoverToggle';


const Sidebar = () => {
  return (
    <aside id="app-menu" className="app-menu">
      <Link
        to="/dashboard"
        className="logo-box sticky top-0 flex min-h-topbar-height items-center justify-start px-6 backdrop-blur-xs"
      >
        <div className="font-bold leading-tight text-primary">
          <div className="logo-lg text-sm">CERRAJERÍA RAMÍREZ</div>
          <div className="logo-sm text-lg">CR</div>
        </div>
      </Link>

      <HoverToggle />

      <div className="relative min-h-0 flex-grow">
        <SimplebarClient className="size-full">
          <AppMenu />
        </SimplebarClient>
      </div>
    </aside>
  );
};

export default Sidebar;
