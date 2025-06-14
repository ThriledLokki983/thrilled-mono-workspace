export interface ButtonProps {
  variant?:
    | 'primary'
    | 'secondary'
    | 'outline'
    | 'text'
    | 'link'
    | 'success'
    | 'warning'
    | 'error'
    | 'subtle';
  size?: 'small' | 'medium' | 'large';
  url?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
  error?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}
