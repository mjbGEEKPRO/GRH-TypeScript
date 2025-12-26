
import React, { useState} from 'react';
import axios from 'axios';
import Bouton from './button';

interface Utilisateur {
  id: number;
  nom: string;
  prenom: string;
  email: string;
}

const ListeUtilisateurs = () => {
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);

  const recupererUtilisateurs = async () => {
    setChargement(true);
    try {
      const reponse = await axios.get("http://127.0.0.1:8000/api/user")                                 
      
      setUtilisateurs(reponse.data);
    } catch (erreur) {
      setErreur('Erreur lors de la récupération des utilisateurs');
      console.error(erreur);
    } finally {
      setChargement(false);
    }
  };

  return (
    <div>
      <Bouton
        texte="Récupérer les utilisateurs"
        onClick={recupererUtilisateurs}
        desactive={chargement}
      />
      {chargement ? (
        <p>Chargement...</p>
      ) : (
        <ul>
          {utilisateurs.map((utilisateur) => (
            <li key={utilisateur.id}>
              {utilisateur.nom} {utilisateur.prenom} ({utilisateur.email})
            </li>
          ))}
        </ul>
      )}
      {erreur && <p style={{ color: 'red' }}>{erreur}</p>}
    </div>
  );
};

export default ListeUtilisateurs;