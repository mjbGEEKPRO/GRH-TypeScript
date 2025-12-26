import React from 'react';

interface BoutonRecuperationProps {
  onClick: () => void;
  texte: string;
  desactive?: boolean;
}

const Bouton: React.FC<BoutonRecuperationProps> = ({
  onClick,
  texte,
  desactive = false,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={desactive}
    >
      {texte}
    </button>
  );
};

export default Bouton;