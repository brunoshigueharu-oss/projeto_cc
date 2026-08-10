import type { SVGProps } from "react";

/**
 * Ícones de rede social exportados do Figma (lucide-react não tem ícones de
 * marca nesta versão). Path data fiel ao asset original; `stroke="currentColor"`
 * substitui a cor fixa do export para herdar o padrão de hover do site.
 */

export function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M14.5837 5.4163H14.592M5.833 1.666H14.167C16.4684 1.666 18.334 3.53163 18.334 5.833V14.167C18.334 16.4684 16.4684 18.334 14.167 18.334H5.833C3.53163 18.334 1.666 16.4684 1.666 14.167V5.833C1.666 3.53163 3.53163 1.666 5.833 1.666ZM13.3334 9.47521C13.4362 10.1688 13.3177 10.8772 12.9948 11.4995C12.6719 12.1219 12.1609 12.6266 11.5346 12.9419C10.9082 13.2571 10.1985 13.3669 9.5062 13.2555C8.81393 13.1441 8.17441 12.8172 7.6786 12.3214C7.18279 11.8256 6.85595 11.1861 6.74455 10.4938C6.63316 9.80153 6.74288 9.09176 7.05813 8.46544C7.37337 7.83912 7.87807 7.32815 8.50046 7.00521C9.12284 6.68227 9.8312 6.5638 10.5248 6.66665C11.2323 6.77156 11.8873 7.10124 12.393 7.60698C12.8988 8.11272 13.2284 8.76772 13.3334 9.47521Z"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M12.5002 1.666H15V4.9996H12.5002C12.2792 4.9996 12.0672 5.0874 11.911 5.2437C11.7547 5.39999 11.6669 5.61197 11.6669 5.833V8.3332H15L14.1667 11.6668H11.6669V18.334H8.33382V11.6668H5.834V8.3332H8.33382V5.833C8.33382 4.72784 8.77277 3.66795 9.55412 2.88649C10.3355 2.10502 11.3952 1.666 12.5002 1.666Z"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function XIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M12.5002 7.4998L7.4998 12.5002M7.4998 7.4998L12.5002 12.5002M18.334 10C18.334 14.6027 14.6027 18.334 10 18.334C5.39726 18.334 1.666 14.6027 1.666 10C1.666 5.39726 5.39726 1.666 10 1.666C14.6027 1.666 18.334 5.39726 18.334 10Z"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </svg>
  );
}
