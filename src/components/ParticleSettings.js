// ParticleSettings.js
import React, { useCallback } from "react";
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";
import ethereumLogo from "../assets/ethereum-logo.svg";         // Εισαγωγή του λογότυπου του Ethereum ως εικόνα για τα particles

const ParticleSettings = () => {
    // Συνάρτηση που αρχικοποιεί το σύστημα των particles φορτώνοντας όλα τα modules του tsparticles
    const particlesInit = useCallback(async (engine) => {
        await loadFull(engine);
    }, []);

    // Συνάρτηση που εκτελείται όταν το σύστημα των particles έχει φορτωθεί
    const particlesLoaded = useCallback(async (container) => {
        console.log(container);
    }, []);

    return (
        <Particles
            id="tsparticles"            // Αναγνωριστικό του component για αναφορά στο DOM
            init={particlesInit}        // Κλήση της συνάρτησης αρχικοποίησης
            loaded={particlesLoaded}    // Κλήση της συνάρτησης που εκτελείται μετά τη φόρτωση
            options={{
                background: {
                    color: {
                        value: "#0d47a1",       // Μπλε φόντο για το εφέ των particles
                    },
                },
                fpsLimit: 60,                   // Μέγιστος αριθμός καρέ ανά δευτερόλεπτο
                interactivity: {
                    events: {
                        onClick: {
                            enable: true,
                            mode: "push",       // Όταν γίνεται κλικ, προστίθενται νέα particles
                        },
                        onHover: {
                            enable: true,
                            mode: "repulse",    // Όταν ο δείκτης περνάει πάνω από τα particles, απομακρύνονται
                        },
                    resize: true,               // Προσαρμογή των particles όταν αλλάζει το μέγεθος της οθόνης
                    },
                    modes: {
                        push: {
                            quantity: 4,        // Προσθήκη 4 νέων particles κατά το κλικ
                        },
                        repulse: {
                            distance: 170,      // Απόσταση απώθησης των particles κατά το hover
                            duration: 0.4,      // Διάρκεια της απώθησης
                        },
                    },
                },
                particles: {
                    color: {
                        value: "#ffffff",       // Χρώμα των particles (λευκό)
                    },
                    links: {
                        color: "#ffffff",       // Χρώμα των συνδέσεων μεταξύ των particles
                        distance: 150,          // Απόσταση που πρέπει να έχουν μεταξύ τους για να δημιουργηθεί σύνδεση
                        enable: true,           // Ενεργοποίηση των συνδέσεων
                        opacity: 0.5,           // Διαφάνεια των συνδέσεων
                        width: 1,               // Πάχος των γραμμών σύνδεσης
                    },
                    move: {
                        direction: "none",      // Τα particles κινούνται τυχαία
                        enable: true,           // Ενεργοποίηση της κίνησης
                        outModes: {
                            default: "bounce",  // Όταν φτάσουν στα όρια, αναπηδούν
                        },
                        random: false,          // Όχι τυχαία ταχύτητα
                        speed: 3,               // Σταθερή ταχύτητα κίνησης
                        minSpeed: 3,            // Ελάχιστη ταχύτητα
                        maxSpeed: 3,            // Μέγιστη ταχύτητα (δεν αλλάζει από την αρχική)
                        straight: false,        // Δεν κινούνται σε ευθεία γραμμή
                    },
                    number: {
                        density: {
                            enable: true,
                            area: 800,           // Περιοχή όπου κινούνται τα particles
                        },
                        value: 80,              // Συνολικός αριθμός των particles
                    },
                    opacity: {
                        value: 0.5,             // Αρχική διαφάνεια των particles
                    },
                    shape: {
                        type: "image",          // Τα particles θα έχουν τη μορφή εικόνας
                        image: {
                            src: ethereumLogo,  // Χρήση του λογότυπου του Ethereum ως particle
                            width: 50,          // Πλάτος εικόνας
                            height: 50,         // Ύψος εικόνας
                        },
                    },
                    size: {
                        random: true,           // Τυχαία μεγέθη στα particles
                        value: 12,              // Μέσο μέγεθος των particles
                    },
                },
                detectRetina: true,             // Ενεργοποίηση για καλύτερη ποιότητα στα retina displays
            }}
        />
    );
};

export default ParticleSettings;
