import React from "react";
import { FaLinkedin, FaEnvelope, FaUniversity, FaEthereum, FaGithub } from "react-icons/fa";  // Εισαγωγή εικονιδίων από react-icons
import metamaskLogo from "../assets/metamask.svg";     // Εισαγωγή λογοτύπου MetaMask
import './Footer.css'; 

const Footer = () => {
  return (
    <footer className="text-white d-flex align-items-center py-2" style={{ backgroundColor: "rgba(0, 0, 0, 0.7)", backdropFilter: "blur(5px)", bottom: 0, width: "100%", height:"60px" }}>
      <div className="container-fluid d-flex justify-content-between">
        {/* Εμφάνιση δημιουργού και πληροφοριών για την τεχνολογία ZKP που χρησιμοποιείται */}
        <div className="text-start py-1">
            &nbsp;&nbsp;
            <small>© 2025  <strong>Grigorios Dimopoulos</strong></small>
            <br />&nbsp;&nbsp;
            <small style={{ fontStyle: "italic", opacity: 0.8 }}>
            Powered by Zero-Knowledge Proof (ZKP) technology for cryptographic privacy and security.
            </small>
        </div>

        {/* Σύνδεσμοι για επαφή με τον δημιουργό και πρόσθετες πληροφορίες */}
        <div className="text-end footer-icons d-flex align-items-center">
            <a href="https://www.linkedin.com/in/grigorios-dimopoulos-357465155/" target="_blank" rel="noopener noreferrer" className="me-3">
                <FaLinkedin size={27} />
            </a>
            <a href="mailto:mscacs23001@uniwa.gr" className="me-3">
                <FaEnvelope size={27} />
            </a>
            <a href="https://github.com/gregdim13" target="_blank" rel="noopener noreferrer" className="me-3">
               <FaGithub size={27} />
            </a>
            <a href="https://msc-acs.uniwa.gr/" target="_blank" rel="noopener noreferrer" className="me-2">
                <FaUniversity size={27} />
            </a>
            <a href="https://ethereum.org" target="_blank" rel="noopener noreferrer" className="me-2">
                <FaEthereum size={27} />
            </a>
            <a href="https://metamask.io/" target="_blank" rel="noopener noreferrer" className="me-3">
                <img src={metamaskLogo} alt="MetaMask" width="32" />
            </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

