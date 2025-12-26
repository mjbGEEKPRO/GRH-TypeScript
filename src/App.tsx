import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import RegisterForm from "./exoserdi/form";
import ForgetPassword from "./composant/interface/mot_de_passe_oubli";
import Formulaire from "./Authentification/formulaire";
import Connexion from "./Authentification/connexion";
import Employer from "./composant/employer/employer";
// import SerdiFormationCarousel from "./composant/mjb/mjb";
import Code from "./Authentification/code";
import Admin from "./composant/interface/admin/admin";
// import AdminCode from "./Authentification/codeAdmin";
// import Dashboard from "./exoserdi/dashbordTest";
// import LogoutManager from "./composant/LogoutManager";
import Permissions from "./composant/interface/permission";
// import ProjectManagement from "./composant/interface/admin/projectModal";
import ModalCompteDesactive from "./composant/interface/deasabled/compte";
// import DarkThemeDemo from "./exoserdi/demoContexte";
// Importer le système de permissions
import { PermissionProvider } from "./contexte/contextPermissions/PermissionContext";
import { authUtils } from "./utils/redirectionForm";
//import du provider de thème
import { ThemeProvider } from "./contexte/contextTheme/ThemeContext";
//import du modal de creattion des departements et des post
import Departement_poste_Create from "./composant/departement/departement";

function App() {
  useEffect(() => {
    // Configurer les intercepteurs API au démarrage
    authUtils.setupapiInterceptor();
  }, []);

  return (
    <ThemeProvider>
      <Router>
        <PermissionProvider>
          <Routes>
            {/* Routes publiques (pas besoin de permissions) */}
            <Route path="/" element={<Connexion />} />
            <Route path="/formulaire" element={<Formulaire />} />
            <Route path="/code" element={<Code />} />
            <Route path="/mot_de_passe_oubli" element={<ForgetPassword />} />
            <Route path="/compte" element={<ModalCompteDesactive />} />
            <Route path="/departement" element={<Departement_poste_Create />} />
            {/* Routes protégées (avec vérification de permissions) */}
            <Route path="/admin" element={<Admin />} />
            <Route path="/permission" element={<Permissions />} />
            {/* <Route path="/dashbordTest" element={<Dashboard />} /> */}
            {/* <Route path="/tacheProjet" element={<ProjectManagement />} /> */}
            <Route path="/departement/employer" element={<Employer />} />
          </Routes>
          {/* LogoutManager peut surveiller les déconnexions */}
        </PermissionProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;

