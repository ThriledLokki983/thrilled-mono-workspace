import { useState, useRef, useEffect } from 'react';
import styles from './Header.module.scss';
import { Search, Bell, ChevronDown, LogOut, Settings, User } from 'lucide-react';

const userMenuItems = [
  { id: 'profile', label: 'Profile', icon: <User size={16} strokeWidth={1.5} /> },
  { id: 'settings', label: 'Settings', icon: <Settings size={16} strokeWidth={1.5} /> },
  { id: 'logout', label: 'Logout', icon: <LogOut size={16} strokeWidth={1.5} /> },
];

export const Header = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className={styles.header}>
      <div className={styles.searchContainer}>
        <div className={styles.searchWrapper}>
          <Search size={20} strokeWidth={1.5} className={styles.searchIcon} />
          <input
            type="search"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          <div className={styles.shortcuts}>
            <kbd>⌘</kbd>
            <kbd>K</kbd>
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        <div className={styles.divider} />

        <button className={styles.iconButton} title="Notifications">
          <Bell size={20} strokeWidth={1.5} className={styles.icon} />
        </button>

        <div className={styles.divider} />

        <button
          className={styles.userButton}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-expanded={isMenuOpen}
          aria-haspopup="true"
          ref={menuRef}
        >
          <img
            src="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxANCxAQCAgJCAgJDQ0NCAkJBw8ICQcKIB0iIiAdHx8kKDQsJCYxJx8fLUctMTNAMDAwIyszQD8uNzQ5QysBCgoKDQ0OFg8PFSsZFhktKzctNzcwLS0rNzAwNys3Lzg3NysrKystKzU1LTcxLS03Ky0rKysrKysrOCsrKysrK//AABEIAMgAyAMBIgACEQEDEQH/xAAcAAACAwEBAQEAAAAAAAAAAAAAAQIDBAUGBwj/xAA4EAACAgECAwUGBAUEAwAAAAAAAQIDEQQhEjFBBSJRYXEGBhMygZEUUqGxIzPB0eFCcvDxFSRi/8QAGgEAAwEBAQEAAAAAAAAAAAAAAAECBAMFBv/EACIRAQEAAgICAwADAQAAAAAAAAABAhEDIQQSMUFREyJhQv/aAAwDAQACEQMRAD8A9gAMD0dGBDAegQDADIBiGQAAAEAxD0ZCGDHoiYhiY9GBAwHoAAEw0DEAx6BAAw0CAADQaAADlowIYYGCAB4AEAAAIYAPQIAEMAiPIh6ICYMTK0ALI2IejAAAaAABj0CBjANAhgAaC8BiOJgBgPQIAAAAAABAwIWWKMW5yUIRTcpSajGMRgxNngvaT3j10ydfZdcNVNZUr55VUZeXieK1nt12hasPXOqPX4NUa2zjlz4Y9Ft9xYj8/S9pNa5cT7U1vHyT/EyR6Psb3kaqnEdbCGvqWzk/4d+PXqGPk4X5Lb67kDk9he0Gn18M6O7NkUnbTNONtTOoacdXuKMAEVoAEAx6AAYBoABgAIY8AGiXAMMHFZAMQyADwLAgBMYmAJnyT3h+1s7rZ6bSWSr0dTcNRjCepmnv9D6trLlXVOc3iFUJTm/CKR+c9Za7bpS3c7Zyk1u22zhz5WTUKs03/gh/x+Jqekklma4fDbcS0z839DBan1tZ8AjZ+Bl+V/crlpWujX0yLY9Ks7O19mntjZprJVXVtOMos+0+yXtHDtHT5zw6yqK/E14wuLxXkfEZaeUVnG3V45HrPdjqHHtOMU0o3VWRlnbixubPG5LMtHNzqvsIAB6RgYAMGMSJACwPAwERYAYAS4AGji7EwGAEQDACIQxAHmveDq/g9kXNZU7uGqOPN7/pk+Q9kabNjlJZSTxtnc+oe81OWlorTaVupTl4bJ/3PHyoVcNkowjjOxj8n5OY77YLtFxLPTr5Cq0ait0mydmsi33J+m6jksqmnykm+vjgwZV0xNULG6S8NtyuekT8Psaum+2Ci2+MV/MS+pO1akZ5adYaxs01jxM/s7Y9L2nRNruQuip5W0YvZ/ualqoN4cs+DzsS1mmTq40sSg001ua+De5YjLGWbj7KiRRpJuVUJS5yhFvpvgvR7UcgMSGBGNANAAPADAiAeAEFoDEcXfQAAAgDAALRCZIiMnm/bihT0kZLHFproWNZXEoPb92jxOo08bY4nZwV5zJt4WDs+3GmlLtDiU50qOkg4WRbhxLialH05Hn7ZPGMvgfzJPDZi5sp7d/TthJJ25vaGl0sH3LpOfTEHzDs6tNv4fexzysMvsxwKuHxIUxlxxrV841xn44yOK4W5KxqyzLsfE22/E8/K7vRTHV3paqZNtNftujnayiKlwuNjS3lwriwjXHVZ24pN/mzuOulS4m3lyTUlv34kzLTpZuI6SnTOC/g3V8bxGcotRnI16iEIw4Zz4K3KMZTecQjlFMKoqKXBlV/y93JV+ngK2ajFu5OUI4bXN4ybeDlx1rXY9etPp/Yvadero49NCyFcJOtRsioyWEv6NHQRwPYrTOvRuTfd1N07q11jHCX9Dvo9fDdxlrLlNXRjEiReiMYhoRGMSGgBgNIBEsAAOWmkgGxAQABARkWMTAnkfeRppS0KnVHinXYoy34X8N/9I8hCvjWIS3wsvPI+o9paRajT2VWY4bYNbrKjLo/ufJaLXBNLn123MvNxS3f66Yd9U7aowXe78+nXczfC42uPU1U9HCUlCWQ1NvDhtNt5y/MwarR2XNOUeGPTdI8301bsXPXTrQ7Pilj8RDjWWp5xBxK41uD7mors55hGam0jkrsuz5ZWfw+i+I1+hdpdNZp33Y5g+e/QXrNdH77+naqSmsruyXNFOqhxLhw5ObSSS4nJ5IaW3KzjhbznfkdX2dqV/aNSmswrcpteaTx+uDd4vjzXtfs7l1t9A7L0/wdNVW+ddcYy3ziXU1oiPJ60mpqM9NDEhlJSJIjkaJBokiKJICSQAgJJYACIawACAtGIBNgkZEwyJsNEi2fKe19N8HV3VyTzGyThlJcVbeV+jR9VbPE+8KuLdTgv/bSk21tx0+H3I5ZNdrwuq8b2lF/Dj8PaTeF0wXdiynR3raadfFrdaiDcoLyMep1GcZT7ucpreIvxmIvFnBLps3Fs87mxm7Rlr2ei/H1/iYz/wDE6JUxpcHTltWW7YfLns/ucztxu7Dqpq0HDhONGZStWOpx12lPi/mwXn8PLiabNX3M8bsm+csYRy4uPf2N42LtOsVtt5ztyPWewekcrLL2u5CPwq3naUnu/wCn3PF6abklGP8Aq3bxtBH13srTwq01cNNHFKgnHO7lnfLPY4MZJJE29NgxAaXNIaIokgJJDTIokhEkhoiiSJCSYAgES0QCI02aNiDImwIMTYMjkaRkjOWFlvCXN9EGf05+Ri1uZwbi9o5WPEzc3k48c67rncpGWztOVlnw9JBbNKVs91Fehwfb+t12aayTbrlCVMp4W1nNfszr9jLvy8eN58+Zv7e7OhrNJOm7lNd2S+aufRowfz5ZzdqJyWZPlOq06s3hwqzq8bWI4tr4JNTi0srKksOJ2JRs090qNWuHUUvaXKN8OjQtUlNbpcXXbKZH8ss1XeyZzbjyv25J/q0SoUrGsR2jybTUYmuFKzvGP2LpTSXSMV9FgWPLjj8JnH+rtFRmUa6lmy6UYR23lJn1uFXw4VxW0VFQj/uSPDe73smV1j1l8eGiHFDRKS+eXWX9Pue+1scqtdfix4fHO5WPl5Y3cLLL8QGi+yG2318ypw8Pqelwedhn1l1UbJMaIjRu6CxDTIEgJJEkRRJE0k0AkBIWCYshkTdoZFkDNfY+LhW3n+Y58nJjxzdcs8pjN1bZco83v4LdmZ2yk8JYi+iZXYuvX7lulXXr18Ujy+Xy8s+p1GbPktiU+7HCeW+bI0rMWvFErFlip2kY7lup1/Vyq18G952hNr6SO1nK9eXqZ9Xp1LmgozGPC3ldG+Y8bror+vJe8Dsb4tHx6YY1WkTl3VvZT1X9TwVOqylxPK8+h9T7ZolDWwtuf4nR2UumVKe1Ked/7nzr2l9lr9NZKegqnquz5NyrdWbLNPHwa5k3uu/HnqdsVmpilz3Ol7Pez1vaVseNTo0CadtuMSuj4R/udvsz2T0tdEJ3J63WcMZWNylOmmzwSXP6nteyElRDCipSTT4UopL06E9RWWdvUbdHp4VVxrogq6KIqFcIrEYoqtTnqIfkrba82a1HCwvr5kIR7+RRCT3yvRohF/TxJw+d+aISWJDhCUPLJCVbXLdfqjUojUTZweXycf8AsLbGiSZpdCly2fWXQzyi4vDW/wC57PDz48s3DCZNEETR1pJoAQEkeRZFkdSzJLxaz6A3puOIZ6tPHkjJOtteLx482dK5eHLp6GOO0mnyTWTy/Ku6y8zInnmty2pYT8x6mlqWyz555jiYLPXe3Cz6RYoLvE2iMPmOWPyrL4WtZRGNaaw/PBYgwWiMOqoSw7O+knF9E4nNWmsjdFU96pt/EfSMDv2Ryu9uupDRVRjJNR4ocScovdSiK/CowxoSfy4S3UEsZfibezFKmucOGP8AGcpZw2t3/kvvhF2OUIKCk1iKSSiTSIk0u1FR2/5lkYx5staE1tgZbUx+dfUcl30KaxJMssXeTHCWYJRiNE1yGSDX+SVmnU1jr/pfgxrmX1fsafF5PXNTjNNPDWGua8GSRr7Tpw1JLaW0v9xjR7uOXtNirEAREFIslul5t/ljJ+jM3Ea9Csxn5pJeouXrGvQqUrO7GX0l6me9YnlcpLYVUu64vmt15BY8w/8AqPLzR4nJye0Ysst9VdBqUcPeS5eOCnGDPKzGGnjx36mmUuLD/Mk/I48l9sd/id7QZCvmTkKtdTliWS6JJIUSSKqIhNbMdPyrHmOS2f1Fp/kXoStKXT1JkJdPqTD6L7DQNb+g8Ec7sKcQtjsOW8U/v6k8Faez8uQEtreUWFVHIsbHRE4/9+bLq1nC6c2UKX3fL0LYvdJesvQrj6qonrocVMtvlw15HGR35RzW1+ZNHn0e9413idWRYCiB3qWdSNujniHrPbzABc3WL0ao18HCXHDk92VRtUlmO/is7oAPnueevJZGHlmsqw6i5J4zzzjxydHTvNUH4xQAc/8AmpibHFABOKMliJoAKyKIzexGj5I+iACFp+H1Jx5CAab8pNlaYwFflU+Es7FE5Yz6AA4VXUvEfsRdiW7e27e/QAFfkT4TqsSzKx4eHLhz3oxL9I295LeXel14fIAOmPdk/VRuzt64x6HD1cOG2S83j0EB7PjX++UOoJjADcT/2Q=="
            alt="User avatar"
            className={styles.avatar}
          />
          <div>
            <span className={styles.userName}>Abrantepa Kwame</span>
            <span className={styles.userMeta}>ID: 4527682</span>
          </div>
          <ChevronDown
            size={22}
            strokeWidth={1.5}
            className={`${styles.icon} ${isMenuOpen ? styles.chevronRotated : ''}`}
          />
        </button>

        {isMenuOpen && (
          <div className={styles.userMenu} role="menu">
            {userMenuItems.map((item) => (
              <button
                key={item.id}
                className={styles.userMenuItem}
                onClick={() => {
                  console.log('Menu clicked:', item.id);
                  setIsMenuOpen(false);
                }}
                role="menuitem"
              >
                <span className={styles.menuItemIcon}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
