import React from "react";
import { FaLinkedin, FaEnvelope, FaUniversity, FaEthereum } from "react-icons/fa"; // npm install react-icons
import metamaskLogo from "../metamask.svg"; // Βάλε το logo στον φάκελο assets
import './Footer.css'; 

const Footer = () => {
  return (
    <footer className="text-white py-2" style={{ backgroundColor: "rgba(0, 0, 0, 0.7)", backdropFilter: "blur(5px)", bottom: 0, width: "100%", height:"50px" }}>
      <div className="container-fluid d-flex justify-content-between">
        
        <div className="text-start py-1">
            &nbsp;&nbsp;<small>© 2025  <strong>Dimopoulos Grigorios</strong></small>
        </div>

        <div className="text-end footer-icons">
            <a href="https://www.linkedin.com/in/grigorios-dimopoulos-357465155/" target="_blank" rel="noopener noreferrer" className="me-3">
                <FaLinkedin size={27} />
            </a>
            <a href="mailto:mscacs23001@uniwa.gr" className="me-3">
                <FaEnvelope size={27} />
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
