import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { LANGUAGES, type Language } from "@/lib/i18n";

// Privacy Policy draft for Clario. Before publication, confirm the operator's
// legal identity/contact details, retention schedule, hosting regions, legal
// bases, international-transfer safeguards, and regional applicability.
// The publication date below must be updated when the policy goes live.
const POLICY_EMAIL = "myclario.help@gmail.com";
const LANGUAGE_STORAGE_KEY = "clario-privacy-language";

interface PolicySection {
  title: string;
  paragraphs?: string[];
  points?: string[];
}
interface PolicyCopy {
  title: string;
  back: string;
  updated: string;
  languageLabel: string;
  intro: string;
  contactLabel: string;
  providerLinkText: string;
  sections: PolicySection[];
}

const POLICY: Record<Language, PolicyCopy> = {
  en: {
    title: "Privacy Policy",
    back: "Back to home",
    updated: "Last updated: October 8, 2026",
    languageLabel: "Policy language",
    intro:
      "This policy explains how Clario handles personal information. Your rights depend on where you live and which laws apply, not on the language you select here.",
    contactLabel: "Privacy questions and requests",
    providerLinkText: "Read Groq's data practices",
    sections: [
      {
        title: "1. Who operates Clario",
        paragraphs: [
          "Clario is a personal finance and daily planning application operated by an independent developer. Contact the operator using the email address at the end of this policy.",
        ],
      },
      {
        title: "2. Information we handle",
        points: [
          "Account information, such as your email address, display name, and sign-in information managed by Supabase Authentication.",
          "Financial information you enter, including income, expenses, dates, descriptions, spending categories, and budgets.",
          "Planner tasks, selected currency, language preference, and related settings.",
          "Questions and recent chat messages you submit when using Ask Lhana, and context used to generate requested AI features.",
          "Session information, locally stored preferences, and limited technical information needed for operation and troubleshooting.",
        ],
      },
      {
        title: "3. Purposes and lawful bases",
        points: [
          "We use your data to provide your account, calculate financial summaries, save tasks, authenticate sign-ins, and respond to your requests.",
          "When you request AI features, we process selected information to generate briefings, insights, or assistant replies.",
          "We process necessary technical information to operate and protect the service and diagnose faults.",
          "Where EU or UK data-protection law applies, providing requested account features may rely on contract necessity, while proportionate security operations may rely on legitimate interests; consent is requested where the law requires it. The precise legal bases must be confirmed before publication.",
        ],
      },
      {
        title: "4. Service providers and sharing",
        points: [
          "Supabase provides database and authentication services.",
          "Groq processes selected content for Clario's AI features.",
          "Google OAuth is used only if you choose Google sign-in. Google Fonts may load fonts in your browser.",
          "Technical infrastructure and error reporting may process limited operational data when enabled. We do not sell your personal information.",
        ],
      },
      {
        title: "5. How AI uses your information",
        points: [
          "Daily Briefing and AI Insights may send financial totals, categories, budget information, task counts, and related summaries to Groq.",
          "Ask Lhana may also send selected recent expense dates, amounts, categories, shortened descriptions, your question, and recent chat history.",
          "Groq does not receive direct access to your Supabase database. Clario creates the information sent in each API request.",
          "According to Groq, inference inputs and outputs are not retained by default, but may be logged for reliability or abuse investigations for up to 30 days, unless legally required for longer. Retained customer data is held in the United States.",
          "AI responses are informational, not professional financial advice.",
        ],
      },
      {
        title: "6. Storage and protection",
        points: [
          "Primary account, finance, and task records are held in Supabase. The precise hosting region should be confirmed with the service operator.",
          "Account access uses Supabase Authentication and database Row Level Security policies; service connections use HTTPS.",
          "No internet service can guarantee absolute security. Contact us if you believe your information has been exposed.",
        ],
      },
      {
        title: "7. International processing",
        paragraphs: [
          "Information may be processed outside your country, including in the United States when sent to Groq. Applicable data-protection laws may require transfer assessments and safeguards; contact us for details of the protections applicable to your data.",
        ],
      },
      {
        title: "8. How long we keep information",
        paragraphs: [
          "Account and user-entered records are generally kept while your account is active. Account deletion requests initiate removal of account-linked records, subject to any legal requirements and service-provider backup or retention processes. Exact backup and log retention periods must be confirmed before publication.",
          "Groq's AI request retention is described in Section 5 and in its provider documentation.",
        ],
      },
      {
        title: "9. Your privacy choices and rights",
        points: [
          "You can edit your profile and request access, correction, or deletion of information using available in-app controls or by contacting us.",
          "The account export tool is available in Settings. Large exports may require additional assistance while full export pagination is improved.",
          "Depending on local law, you may also have rights to portability, objection, restriction of processing, withdrawal of consent, and a complaint to a privacy regulator.",
          "We handle verified requests within the time period required by the law that applies to you.",
        ],
      },
      {
        title: "10. Regional privacy information",
        points: [
          "European Union / EEA and United Kingdom: GDPR or UK GDPR rights may apply, including access, correction, erasure, portability, restriction, objection, and complaints to the relevant supervisory authority.",
          "Switzerland: rights under the Swiss Federal Act on Data Protection may apply, including access and correction; international disclosure rules may also apply.",
          "Canada, including Quebec: applicable federal and provincial privacy laws may provide access, correction, consent and withdrawal rights; Quebec has additional notice and cross-border assessment rules.",
          "United States: if an applicable state law covers Clario, you may have rights to know, access, correct, delete, or opt out of specified uses. California law applies only when its legal scope requirements are met.",
          "Spain and Spanish-speaking Latin America: Spain follows the GDPR; Mexico may provide ARCO (access, correction, cancellation, opposition) rights, while other countries have their own privacy laws and procedures that apply where legally required.",
        ],
      },
      {
        title: "11. Cookies and local storage",
        paragraphs: [
          "Clario uses authentication or session storage and saves some preferences in your browser, including the cookie-banner choice. A consent banner is shown on first visit. Declining does not disable storage essential for signing in or using the service.",
          "If non-essential tracking is introduced, it should be documented and controlled according to the rules that apply in your region.",
        ],
      },
      {
        title: "12. Changes and contact",
        paragraphs: [
          "We may revise this policy to reflect changes in the service or law. Material changes will be communicated where required. Contact the privacy representative using the email below to ask questions or exercise your rights.",
        ],
      },
    ],
  },
  de: {
    title: "Datenschutzerklärung",
    back: "Zur Startseite",
    updated: "Zuletzt aktualisiert: 8. Oktober 2026",
    languageLabel: "Sprache der Datenschutzerklärung",
    intro:
      "Diese Erklärung beschreibt, wie Clario personenbezogene Daten verarbeitet. Ihre Rechte hängen von Ihrem Aufenthaltsort und den anwendbaren Gesetzen ab, nicht von der hier gewählten Sprache.",
    contactLabel: "Fragen und Anfragen zum Datenschutz",
    providerLinkText: "Datenschutzhinweise von Groq lesen",
    sections: [
      {
        title: "1. Wer Clario betreibt",
        paragraphs: [
          "Clario ist eine Anwendung für persönliche Finanzen und Tagesplanung, die von einem unabhängigen Entwickler betrieben wird. Sie erreichen den Betreiber über die E-Mail-Adresse am Ende dieser Erklärung.",
        ],
      },
      {
        title: "2. Welche Daten wir verarbeiten",
        points: [
          "Kontodaten wie E-Mail-Adresse, Anzeigename und Anmeldeinformationen, die über Supabase Authentication verwaltet werden.",
          "Von Ihnen eingegebene Finanzdaten, darunter Einnahmen, Ausgaben, Daten, Beschreibungen, Kategorien und Budgets.",
          "Planungsaufgaben, gewählte Währung, Sprache und zugehörige Einstellungen.",
          "Fragen und letzte Chatnachrichten an Ask Lhana sowie Informationen zur Erstellung angeforderter KI-Funktionen.",
          "Sitzungsdaten, lokal gespeicherte Einstellungen und begrenzte technische Informationen für Betrieb und Fehlerbehebung.",
        ],
      },
      {
        title: "3. Zwecke und Rechtsgrundlagen",
        points: [
          "Wir verarbeiten Daten, um Ihr Konto bereitzustellen, Finanzübersichten zu berechnen, Aufgaben zu speichern, Anmeldungen zu sichern und Anfragen zu beantworten.",
          "Wenn Sie KI-Funktionen verwenden, verarbeiten wir ausgewählte Informationen für Briefings, Einblicke und Antworten des Assistenten.",
          "Notwendige technische Daten dienen dem sicheren Betrieb und der Fehleranalyse.",
          "Soweit die DSGVO oder die britische UK GDPR gilt, kann die Bereitstellung angeforderter Kontofunktionen auf Vertragserfüllung und angemessene Sicherheitsmaßnahmen auf berechtigte Interessen gestützt werden. Eine Einwilligung wird eingeholt, wenn sie gesetzlich erforderlich ist. Die konkreten Rechtsgrundlagen sind vor der Veröffentlichung zu bestätigen.",
        ],
      },
      {
        title: "4. Dienstleister und Weitergabe",
        points: [
          "Supabase stellt Datenbank- und Authentifizierungsdienste bereit.",
          "Groq verarbeitet ausgewählte Inhalte für KI-Funktionen von Clario.",
          "Google OAuth wird nur bei Anmeldung mit Google verwendet. Google Fonts kann Schriftarten in Ihrem Browser laden.",
          "Technische Infrastruktur und Fehlerberichte können, sofern aktiviert, begrenzte Betriebsdaten verarbeiten. Wir verkaufen keine personenbezogenen Daten.",
        ],
      },
      {
        title: "5. Verarbeitung durch künstliche Intelligenz",
        points: [
          "Daily Briefing und AI Insights können Finanzsummen, Kategorien, Budgetinformationen, Aufgabenzahlen und zugehörige Übersichten an Groq senden.",
          "Ask Lhana kann außerdem ausgewählte aktuelle Ausgabendaten, Beträge, Kategorien, gekürzte Beschreibungen, Ihre Frage und den letzten Chatverlauf übermitteln.",
          "Groq erhält keinen direkten Zugriff auf Ihre Supabase-Datenbank. Clario stellt die Inhalte jeder API-Anfrage selbst zusammen.",
          "Nach Angaben von Groq werden Eingaben und Ausgaben von KI-Anfragen standardmäßig nicht gespeichert; für Zuverlässigkeit oder Missbrauchsuntersuchungen können sie jedoch bis zu 30 Tage protokolliert werden, sofern keine längere gesetzliche Pflicht besteht. Gespeicherte Kundendaten liegen in den USA.",
          "KI-Antworten dienen der Information und sind keine professionelle Finanzberatung.",
        ],
      },
      {
        title: "6. Speicherung und Schutz",
        points: [
          "Die wichtigsten Konto-, Finanz- und Aufgabendaten werden bei Supabase gespeichert. Die genaue Hosting-Region muss beim Betreiber bestätigt werden.",
          "Der Zugang wird durch Supabase Authentication und Row Level Security geschützt; Verbindungen erfolgen über HTTPS.",
          "Absolute Sicherheit kann kein Internetdienst garantieren. Melden Sie uns einen möglichen Datenvorfall.",
        ],
      },
      {
        title: "7. Internationale Datenverarbeitung",
        paragraphs: [
          "Daten können außerhalb Ihres Landes verarbeitet werden, unter anderem in den USA bei Nutzung von Groq. Je nach Recht sind Prüfungen und Schutzmaßnahmen für Übermittlungen erforderlich. Informationen zu den für Ihre Daten geltenden Garantien erhalten Sie auf Anfrage.",
        ],
      },
      {
        title: "8. Speicherdauer",
        paragraphs: [
          "Kontodaten und Ihre Einträge werden im Regelfall während der Nutzung Ihres Kontos aufbewahrt. Eine Kontolöschung stößt die Entfernung zugehöriger Daten an, vorbehaltlich gesetzlicher Pflichten sowie Sicherungs- und Aufbewahrungsverfahren der Dienstleister. Genaue Fristen für Backups und Protokolle müssen vor Veröffentlichung bestätigt werden.",
          "Die mögliche Speicherung von KI-Anfragen durch Groq wird in Abschnitt 5 und in dessen Dokumentation erläutert.",
        ],
      },
      {
        title: "9. Ihre Datenschutzrechte",
        points: [
          "Sie können Ihr Profil bearbeiten und Auskunft, Berichtigung oder Löschung über die App oder per E-Mail beantragen.",
          "In den Einstellungen steht ein Datenexport zur Verfügung. Bei großen Datenmengen kann bis zur Verbesserung des Exports zusätzliche Unterstützung nötig sein.",
          "Je nach Recht können außerdem Rechte auf Datenübertragbarkeit, Widerspruch, Einschränkung, Widerruf einer Einwilligung und Beschwerde bei einer Aufsichtsbehörde bestehen.",
          "Geprüfte Anfragen beantworten wir innerhalb der jeweils gesetzlich vorgeschriebenen Frist.",
        ],
      },
      {
        title: "10. Hinweise für einzelne Regionen",
        points: [
          "EU / EWR und Vereinigtes Königreich: Rechte nach DSGVO beziehungsweise UK GDPR können gelten, darunter Auskunft, Berichtigung, Löschung, Übertragbarkeit, Einschränkung, Widerspruch und Beschwerde.",
          "Schweiz: Das schweizerische Datenschutzgesetz (DSG) kann Rechte auf Auskunft und Berichtigung sowie Regeln für Auslandsbekanntgaben vorsehen.",
          "Kanada einschließlich Québec: Bundes- und Provinzgesetze können Auskunfts-, Berichtigungs- und Einwilligungsrechte vorsehen; in Québec gelten zusätzliche Informations- und Auslandsübermittlungsregeln.",
          "USA: Soweit einzelstaatliche Datenschutzgesetze auf Clario anwendbar sind, können Rechte auf Auskunft, Berichtigung, Löschung und Widerspruch bestehen. Das kalifornische Recht gilt nur bei Erfüllung seiner gesetzlichen Voraussetzungen.",
          "Spanien unterliegt der DSGVO. In Mexiko können ARCO-Rechte (Auskunft, Berichtigung, Löschung, Widerspruch) gelten; weitere lateinamerikanische Länder haben eigene Gesetze und Verfahren.",
        ],
      },
      {
        title: "11. Cookies und lokale Speicherung",
        paragraphs: [
          "Clario verwendet Speicher für Anmeldung und Sitzung und speichert bestimmte Einstellungen im Browser, einschließlich der Entscheidung im Cookie-Banner. Bei Ihrem ersten Besuch erscheint ein Hinweis. Eine Ablehnung deaktiviert keine für Anmeldung oder Nutzung notwendigen Speicherfunktionen.",
          "Falls künftig nicht notwendiges Tracking hinzukommt, muss es nach den jeweils geltenden Regeln beschrieben und steuerbar sein.",
        ],
      },
      {
        title: "12. Änderungen und Kontakt",
        paragraphs: [
          "Wir können diese Erklärung bei Änderungen des Dienstes oder der Rechtslage anpassen. Über wesentliche Änderungen informieren wir, soweit vorgeschrieben. Für Fragen oder die Ausübung Ihrer Rechte wenden Sie sich an die unten genannte Datenschutzkontaktadresse.",
        ],
      },
    ],
  },
  es: {
    title: "Política de privacidad",
    back: "Volver al inicio",
    updated: "Última actualización: 8 de octubre de 2026",
    languageLabel: "Idioma de la política",
    intro:
      "Esta política explica cómo Clario trata los datos personales. Tus derechos dependen de tu país y de la legislación aplicable, no del idioma que elijas aquí.",
    contactLabel: "Consultas y solicitudes de privacidad",
    providerLinkText: "Consultar las prácticas de datos de Groq",
    sections: [
      {
        title: "1. Quién gestiona Clario",
        paragraphs: [
          "Clario es una aplicación de finanzas personales y planificación diaria gestionada por un desarrollador independiente. Puedes contactar con el responsable mediante el correo indicado al final de esta política.",
        ],
      },
      {
        title: "2. Qué información tratamos",
        points: [
          "Datos de cuenta, como el correo electrónico, el nombre visible y los datos de acceso gestionados por Supabase Authentication.",
          "Datos financieros introducidos por ti: ingresos, gastos, fechas, descripciones, categorías y presupuestos.",
          "Tareas del planificador, moneda elegida, idioma y ajustes relacionados.",
          "Preguntas y mensajes recientes enviados a Ask Lhana, así como el contexto utilizado para generar funciones de IA solicitadas.",
          "Datos de sesión, preferencias guardadas localmente e información técnica limitada necesaria para operar el servicio y resolver errores.",
        ],
      },
      {
        title: "3. Finalidades y bases jurídicas",
        points: [
          "Utilizamos tus datos para ofrecer tu cuenta, calcular resúmenes financieros, guardar tareas, autenticar el acceso y atender solicitudes.",
          "Al solicitar funciones de IA, tratamos datos seleccionados para elaborar resúmenes, análisis o respuestas del asistente.",
          "Tratamos información técnica necesaria para mantener la seguridad y detectar problemas.",
          "Si se aplica el RGPD de la UE o del Reino Unido, las funciones esenciales solicitadas pueden basarse en la ejecución de un contrato y ciertas medidas de seguridad en el interés legítimo. Solicitamos consentimiento cuando la ley lo exige. Es necesario confirmar las bases jurídicas concretas antes de publicar.",
        ],
      },
      {
        title: "4. Proveedores y comunicación de datos",
        points: [
          "Supabase ofrece servicios de base de datos y autenticación.",
          "Groq trata contenido seleccionado para las funciones de IA de Clario.",
          "Google OAuth se utiliza únicamente si eliges iniciar sesión con Google. Google Fonts puede cargar tipografías en tu navegador.",
          "La infraestructura técnica y los servicios de errores pueden tratar datos operativos limitados cuando estén activados. No vendemos tus datos personales.",
        ],
      },
      {
        title: "5. Cómo utiliza la IA tu información",
        points: [
          "Daily Briefing y AI Insights pueden enviar a Groq importes totales, categorías, presupuestos, número de tareas y resúmenes relacionados.",
          "Ask Lhana también puede enviar fechas e importes de gastos recientes seleccionados, categorías, descripciones abreviadas, tu consulta y mensajes recientes del chat.",
          "Groq no tiene acceso directo a tu base de datos de Supabase. Clario prepara el contenido de cada solicitud a la API.",
          "Según Groq, las entradas y salidas de inferencia no se conservan por defecto, aunque pueden registrarse hasta 30 días para resolver problemas de fiabilidad o investigar abusos, salvo obligación legal de conservarlas más tiempo. Los datos conservados se almacenan en Estados Unidos.",
          "Las respuestas de IA son informativas y no constituyen asesoramiento financiero profesional.",
        ],
      },
      {
        title: "6. Almacenamiento y seguridad",
        points: [
          "Los registros principales de cuenta, finanzas y tareas se almacenan en Supabase. Debe confirmarse con el responsable la región exacta de alojamiento.",
          "El acceso utiliza Supabase Authentication y políticas de seguridad por filas (RLS); las conexiones utilizan HTTPS.",
          "Ningún servicio de Internet puede garantizar seguridad absoluta. Contáctanos si sospechas un incidente con tus datos.",
        ],
      },
      {
        title: "7. Tratamiento internacional",
        paragraphs: [
          "La información puede tratarse fuera de tu país, incluido Estados Unidos cuando se utiliza Groq. La legislación aplicable puede exigir evaluaciones y garantías para transferencias internacionales. Puedes solicitarnos información sobre las salvaguardias aplicables.",
        ],
      },
      {
        title: "8. Plazos de conservación",
        paragraphs: [
          "En general, conservamos los datos de cuenta y los registros introducidos mientras la cuenta esté activa. La solicitud de eliminación inicia la supresión de los datos asociados, con las excepciones legales y los procesos de copias de seguridad o conservación de proveedores. Antes de publicar deben confirmarse los plazos concretos de copias y registros técnicos.",
          "La conservación de solicitudes de IA por Groq se explica en la sección 5 y en su documentación.",
        ],
      },
      {
        title: "9. Tus opciones y derechos",
        points: [
          "Puedes editar tu perfil y solicitar acceso, rectificación o supresión mediante la aplicación o escribiéndonos.",
          "Hay una función de exportación en Ajustes. Para grandes volúmenes de datos, puede hacer falta asistencia adicional hasta mejorar la paginación de exportaciones.",
          "Según la ley aplicable, también puedes tener derechos de portabilidad, oposición, limitación, retirada del consentimiento y reclamación ante una autoridad de protección de datos.",
          "Tramitamos solicitudes verificadas dentro del plazo exigido por la legislación aplicable.",
        ],
      },
      {
        title: "10. Información según la región",
        points: [
          "Unión Europea / EEE y Reino Unido: pueden aplicarse los derechos del RGPD o UK GDPR, incluidos acceso, rectificación, supresión, portabilidad, limitación, oposición y reclamación.",
          "Suiza: la Ley Federal de Protección de Datos puede reconocer derechos de acceso y rectificación y establecer reglas para comunicaciones internacionales.",
          "Canadá, incluido Quebec: pueden aplicarse normas federales y provinciales sobre acceso, corrección y consentimiento; Quebec establece obligaciones adicionales sobre información y transferencias.",
          "Estados Unidos: si Clario está sujeto a una ley estatal pertinente, pueden corresponder derechos de información, acceso, corrección, eliminación u oposición. La ley de California solo aplica si se cumplen sus condiciones legales.",
          "España está sujeta al RGPD. En México pueden aplicarse los derechos ARCO (acceso, rectificación, cancelación y oposición); otros países de América Latina tienen sus propias normas y procedimientos.",
        ],
      },
      {
        title: "11. Cookies y almacenamiento local",
        paragraphs: [
          "Clario utiliza almacenamiento necesario para la autenticación y la sesión, y guarda algunas preferencias en el navegador, incluida tu elección en el aviso de cookies. El aviso aparece en la primera visita. Rechazarlo no desactiva el almacenamiento imprescindible para acceder o utilizar el servicio.",
          "Si se incorporan tecnologías de seguimiento no esenciales, deberán explicarse y ofrecer los controles exigidos en cada región.",
        ],
      },
      {
        title: "12. Cambios y contacto",
        paragraphs: [
          "Podemos modificar esta política si cambia el servicio o la legislación. Comunicaremos los cambios importantes cuando corresponda. Escribe al contacto de privacidad indicado abajo para resolver dudas o ejercer tus derechos.",
        ],
      },
    ],
  },
  fr: {
    title: "Politique de confidentialité",
    back: "Retour à l’accueil",
    updated: "Dernière mise à jour : 8 octobre 2026",
    languageLabel: "Langue de la politique",
    intro:
      "Cette politique explique comment Clario traite les données personnelles. Vos droits dépendent de votre pays et des lois applicables, et non de la langue choisie ici.",
    contactLabel: "Questions et demandes relatives à la confidentialité",
    providerLinkText: "Consulter les pratiques de Groq en matière de données",
    sections: [
      {
        title: "1. Qui exploite Clario",
        paragraphs: [
          "Clario est une application de finances personnelles et de planification quotidienne exploitée par un développeur indépendant. Vous pouvez contacter le responsable à l’adresse électronique indiquée à la fin de cette politique.",
        ],
      },
      {
        title: "2. Les données que nous traitons",
        points: [
          "Données de compte : adresse électronique, nom affiché et données de connexion gérées par Supabase Authentication.",
          "Données financières saisies : revenus, dépenses, dates, descriptions, catégories et budgets.",
          "Tâches du planificateur, devise choisie, langue et paramètres associés.",
          "Questions et messages récents soumis à Ask Lhana ainsi que le contexte utilisé pour les fonctions d’IA demandées.",
          "Informations de session, préférences conservées localement et données techniques limitées nécessaires au fonctionnement et au dépannage.",
        ],
      },
      {
        title: "3. Finalités et bases juridiques",
        points: [
          "Nous utilisons vos données pour fournir votre compte, calculer des synthèses financières, enregistrer des tâches, sécuriser l’accès et répondre à vos demandes.",
          "Lorsque vous demandez une fonction d’IA, certaines données servent à produire des briefings, analyses ou réponses de l’assistant.",
          "Des informations techniques nécessaires servent à protéger le service et diagnostiquer les incidents.",
          "Si le RGPD européen ou britannique s’applique, la fourniture des fonctions demandées peut reposer sur l’exécution d’un contrat et certaines mesures de sécurité sur l’intérêt légitime. Le consentement est demandé lorsque la loi l’exige. Les bases juridiques précises doivent être confirmées avant publication.",
        ],
      },
      {
        title: "4. Prestataires et partage",
        points: [
          "Supabase fournit les services de base de données et d’authentification.",
          "Groq traite certains contenus pour les fonctions d’IA de Clario.",
          "Google OAuth est utilisé uniquement si vous choisissez de vous connecter avec Google. Google Fonts peut charger des polices dans votre navigateur.",
          "L’infrastructure technique et les services de signalement d’erreurs peuvent traiter des données de fonctionnement limitées lorsqu’ils sont activés. Nous ne vendons pas vos données personnelles.",
        ],
      },
      {
        title: "5. Utilisation de vos données par l’IA",
        points: [
          "Daily Briefing et AI Insights peuvent transmettre à Groq des totaux financiers, catégories, budgets, nombres de tâches et synthèses associées.",
          "Ask Lhana peut aussi transmettre certaines dates et sommes de dépenses récentes, leurs catégories, descriptions abrégées, votre question et des messages récents.",
          "Groq n’a pas d’accès direct à votre base Supabase. Clario prépare les informations de chaque requête API.",
          "Selon Groq, les entrées et sorties d’inférence ne sont pas conservées par défaut, mais peuvent être enregistrées jusqu’à 30 jours pour des raisons de fiabilité ou pour enquêter sur des abus, sauf obligation légale plus longue. Les données client conservées sont stockées aux États-Unis.",
          "Les réponses de l’IA sont informatives et ne constituent pas des conseils financiers professionnels.",
        ],
      },
      {
        title: "6. Stockage et protection",
        points: [
          "Les principales données de compte, de finances et de tâches sont hébergées par Supabase. La région exacte d’hébergement doit être confirmée auprès du responsable.",
          "L’accès repose sur Supabase Authentication et des règles de sécurité au niveau des lignes (RLS) ; les connexions utilisent HTTPS.",
          "Aucun service en ligne ne peut garantir une sécurité absolue. Contactez-nous si vous soupçonnez une divulgation de données.",
        ],
      },
      {
        title: "7. Traitement international",
        paragraphs: [
          "Les informations peuvent être traitées hors de votre pays, notamment aux États-Unis lorsqu’elles sont envoyées à Groq. Les lois applicables peuvent imposer des évaluations et garanties pour ces transferts. Contactez-nous pour connaître les mesures applicables à vos données.",
        ],
      },
      {
        title: "8. Durée de conservation",
        paragraphs: [
          "Les données de compte et les informations saisies sont en général conservées tant que le compte est actif. La suppression du compte déclenche la suppression des données associées, sous réserve des obligations légales et des procédures de sauvegarde ou de conservation des prestataires. Les délais exacts des sauvegardes et journaux doivent être confirmés avant publication.",
          "La conservation éventuelle des requêtes d’IA par Groq est présentée à la section 5 et dans sa documentation.",
        ],
      },
      {
        title: "9. Vos choix et vos droits",
        points: [
          "Vous pouvez modifier votre profil et demander l’accès, la rectification ou la suppression de vos informations via l’application ou par courriel.",
          "Un outil d’exportation est disponible dans Paramètres. Les volumes importants peuvent nécessiter une assistance supplémentaire jusqu’à l’amélioration de la pagination des exports.",
          "Selon le droit applicable, vous pouvez également disposer de droits à la portabilité, à l’opposition, à la limitation du traitement, au retrait du consentement et à la réclamation auprès d’une autorité de contrôle.",
          "Nous traitons les demandes vérifiées dans les délais imposés par la loi applicable.",
        ],
      },
      {
        title: "10. Informations par région",
        points: [
          "Union européenne / EEE et Royaume-Uni : les droits du RGPD ou du UK GDPR peuvent s’appliquer, notamment l’accès, la rectification, l’effacement, la portabilité, la limitation, l’opposition et la réclamation.",
          "Suisse : la loi fédérale sur la protection des données (LPD) peut prévoir des droits d’accès et de rectification ainsi que des règles de communication à l’étranger.",
          "Canada, y compris Québec : les lois fédérales et provinciales peuvent garantir l’accès, la correction et certains droits liés au consentement ; le Québec impose des obligations supplémentaires d’information et de transfert.",
          "États-Unis : si une loi d’un État s’applique à Clario, des droits d’information, d’accès, de rectification, de suppression ou d’opposition peuvent exister. La loi californienne ne s’applique que si ses critères légaux sont remplis.",
          "L’Espagne est soumise au RGPD. Le Mexique peut reconnaître les droits ARCO (accès, rectification, annulation et opposition) ; d’autres pays d’Amérique latine ont leurs propres lois et procédures.",
        ],
      },
      {
        title: "11. Cookies et stockage local",
        paragraphs: [
          "Clario utilise des moyens de stockage nécessaires à la connexion et aux sessions, et enregistre certaines préférences dans le navigateur, dont le choix exprimé dans la bannière de cookies. Cette bannière apparaît lors de la première visite. Un refus ne désactive pas les mécanismes essentiels à la connexion ou à l’utilisation du service.",
          "Tout suivi non essentiel ajouté ultérieurement devra être expliqué et contrôlé conformément aux règles locales applicables.",
        ],
      },
      {
        title: "12. Modifications et contact",
        paragraphs: [
          "Nous pouvons modifier cette politique lorsque le service ou la loi évolue. Les changements importants seront communiqués lorsque cela est requis. Contactez le responsable de la confidentialité à l’adresse ci-dessous pour toute question ou pour exercer vos droits.",
        ],
      },
    ],
  },
};

function isLanguage(value: string | null): value is Language {
  return value === "en" || value === "de" || value === "es" || value === "fr";
}

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Clario" },
      {
        name: "description",
        content: "How Clario handles personal data, AI processing, and privacy rights.",
      },
      { property: "og:title", content: "Privacy Policy — Clario" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  // The /privacy route is PUBLIC and outside AppShell/LanguageProvider.
  // Use an independent selector; URL > saved policy preference > browser language.
  const [language, setLanguage] = useState<Language>("en");

  useEffect(() => {
    const urlChoice = new URLSearchParams(window.location.search).get("lang");
    let saved: string | null = null;
    try {
      saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    } catch {
      // Private browsing settings may block local storage.
    }
    const browser = window.navigator.language.split("-")[0].toLowerCase();
    if (isLanguage(urlChoice)) setLanguage(urlChoice);
    else if (isLanguage(saved)) setLanguage(saved);
    else if (isLanguage(browser)) setLanguage(browser);
  }, []);

  useEffect(() => {
    document.title = `${POLICY[language].title} — Clario`;
  }, [language]);

  function selectLanguage(next: Language) {
    setLanguage(next);
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
      const url = new URL(window.location.href);
      url.searchParams.set("lang", next);
      window.history.replaceState(window.history.state, "", url.toString());
    } catch {
      // Local storage can be unavailable; the on-page selector still works.
    }
  }

  const copy = POLICY[language];

  return (
    <main lang={language} className="min-h-screen bg-background px-4 py-10 md:px-8">
      <div className="mx-auto max-w-2xl space-y-8">
        <header className="space-y-4">
          <Link to="/" className="text-sm text-primary hover:underline">
            ← {copy.back}
          </Link>
          <div
            className="flex flex-wrap items-center gap-2"
            role="group"
            aria-label={copy.languageLabel}
          >
            <span className="mr-1 text-sm text-muted-foreground">{copy.languageLabel}:</span>
            {LANGUAGES.map(({ code, label }) => (
              <button
                key={code}
                type="button"
                lang={code}
                aria-pressed={language === code}
                onClick={() => selectLanguage(code)}
                className={`rounded-md border px-3 py-1 text-sm transition-colors ${
                  language === code
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-foreground hover:bg-muted"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground">
            {copy.title}
          </h1>
          <p className="text-sm text-muted-foreground">{copy.updated}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{copy.intro}</p>
        </header>

        {copy.sections.map((section) => (
          <section key={section.title} className="space-y-2">
            <h2 className="font-display text-xl font-semibold text-foreground">{section.title}</h2>
            <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {section.points && (
                <ul className="list-disc space-y-1 pl-5">
                  {section.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        ))}

        <div className="space-y-2 border-t border-border pt-5 text-sm text-muted-foreground">
          <p>
            {copy.contactLabel}:{" "}
            <a href={`mailto:${POLICY_EMAIL}`} className="text-primary underline">
              {POLICY_EMAIL}
            </a>
          </p>
          <p>
            <a
              href="https://console.groq.com/docs/your-data"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              {copy.providerLinkText}
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
