import type { IconType } from 'react-icons';
import { FaWhatsapp, FaInstagram, FaFacebookMessenger, FaBullhorn, FaUserEdit } from 'react-icons/fa';

// PlataformaEnum (back-end): 1 WhatsappMeta, 2 WhatsappEvolution, 3 Instagram, 4 FacebookMessenger, 5 LeadAds, 6 Manual
const ORIGIN_CONFIG: Record<number, { label: string; className: string; icon: IconType }> = {
    1: { label: 'WhatsApp', className: 'badge-origin-whatsapp', icon: FaWhatsapp },
    2: { label: 'WhatsApp', className: 'badge-origin-whatsapp', icon: FaWhatsapp },
    3: { label: 'Instagram', className: 'badge-origin-instagram', icon: FaInstagram },
    4: { label: 'Messenger', className: 'badge-origin-messenger', icon: FaFacebookMessenger },
    5: { label: 'Lead Ads', className: 'badge-origin-leadads', icon: FaBullhorn },
    6: { label: 'Manual', className: 'badge-origin-manual', icon: FaUserEdit },
};

interface OriginBadgeProps {
    idOrigem?: number | null;
    descricao?: string;
}

const OriginBadge: React.FC<OriginBadgeProps> = ({ idOrigem, descricao }) => {
    if (!idOrigem) return null;
    const config = ORIGIN_CONFIG[idOrigem];
    if (!config) return null;

    const Icon = config.icon;
    return (
        <span className={`badge ${config.className}`} title={descricao || config.label}>
            <Icon size={9} />
            {config.label}
        </span>
    );
};

export default OriginBadge;
