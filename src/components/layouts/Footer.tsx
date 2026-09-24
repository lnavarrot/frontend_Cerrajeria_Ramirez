import { appName, currentYear } from '@/helpers/constants';
const Footer=()=> <footer className="mt-auto footer flex items-center py-5 border-t border-default-200"><div className="lg:px-8 px-6 w-full text-center md:text-left">{currentYear} © {appName} — Portal de Atención y Soporte Técnico</div></footer>;
export default Footer;
