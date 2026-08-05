import {
  Lock, ArrowLeftRight, BarChart2, ShieldCheck, Briefcase,
  Wrench, DollarSign, Check, ArrowRight, Mail, Phone, MapPin,
  Clock, Calendar, Share2, Link2,
  Bookmark, Quote, ChevronRight,
} from "lucide-react";

const ICONS = {
  lock:      Lock,
  transfer:  ArrowLeftRight,
  chart:     BarChart2,
  shield:    ShieldCheck,
  briefcase: Briefcase,
  wrench:    Wrench,
  dollar:    DollarSign,
  check:     Check,
  arrow:     ArrowRight,
  mail:      Mail,
  phone:     Phone,
  mapPin:    MapPin,
  clock:     Clock,
  calendar:  Calendar,
  share:     Share2,
  link:      Link2,
  bookmark:  Bookmark,
  quote:     Quote,
  chevron:   ChevronRight,
};

export function Icon({ name, className = "", size = 24, strokeWidth = 1.9 }) {
  const LucideIcon = ICONS[name] ?? ICONS.shield;
  return <LucideIcon className={className} size={size} strokeWidth={strokeWidth} aria-hidden />;
}
