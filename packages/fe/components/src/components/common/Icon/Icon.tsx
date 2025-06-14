import type { IconProps } from './Icon.interface';

import styles from './Icon.module.scss';
import Icons from '../../../assets/icons/sprite.svg';

/**
 * @TODO: further memoize this component?
 */
const Icon = ({ name, color, width = 24, height = 24 }: IconProps) => {
  return (
    <svg
      className={`${styles.root} icon-${name}`}
      data-icon={name}
      fill={color}
      width={width}
      height={height || width}
      role="presentation"
      aria-hidden="true"
    >
      <use xlinkHref={`${Icons}#icon-${name}`} />
    </svg>
  );
};

export default Icon;
