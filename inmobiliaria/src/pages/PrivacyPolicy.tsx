import { Link } from "react-router-dom";

const PrivacyPolicy = () => {
  const lastUpdated = "22 de junio de 2026";

  return (
    <main className="min-h-screen bg-background text-foreground py-16">
      <div className="container max-w-4xl mx-auto px-4">
        <Link to="/" className="text-primary hover:underline text-sm">
          ← Volver al inicio
        </Link>

        <header className="mt-6 mb-10">
          <h1 className="text-4xl md:text-5xl font-display font-bold gradient-text mb-3">
            Política de Privacidad
          </h1>
          <p className="text-sm text-muted-foreground">
            Última actualización: {lastUpdated}
          </p>
        </header>

        <article className="prose prose-invert max-w-none space-y-8 text-foreground/90 leading-relaxed">
          <section>
            <h2 className="text-2xl font-display font-semibold text-primary mb-3">
              1. Identidad del Responsable
            </h2>
            <p>
              <strong>CIRE — Círculo de Innovación en Real Estate</strong> ("CIRE",
              "nosotros") es responsable del tratamiento de los datos personales
              recopilados a través del sitio web{" "}
              <a href="https://cireinmobiliaria.com" className="text-primary hover:underline">
                https://cireinmobiliaria.com
              </a>{" "}
              y de los formularios publicitarios alojados en plataformas de Meta
              (Facebook e Instagram).
            </p>
            <p className="mt-2">
              Contacto: <a href="mailto:info@cireinmobiliaria.com" className="text-primary hover:underline">info@cireinmobiliaria.com</a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-primary mb-3">
              2. Datos que Recopilamos
            </h2>
            <p>
              Recopilamos únicamente los datos que el usuario nos proporciona
              voluntariamente al completar nuestros formularios de contacto (web
              o anuncios de Meta — Lead Ads):
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Nombre y apellido</li>
              <li>Número de teléfono / WhatsApp</li>
              <li>Correo electrónico</li>
              <li>Dirección o zona de la propiedad</li>
              <li>Información sobre el inmueble y motivo de venta</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-primary mb-3">
              3. Finalidad del Tratamiento
            </h2>
            <p>Los datos se utilizan exclusivamente para:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Contactar al usuario para evaluar la compra de su propiedad.</li>
              <li>Enviar una oferta o información comercial relacionada.</li>
              <li>Coordinar visitas, tasaciones y operaciones inmobiliarias.</li>
              <li>Cumplir con obligaciones legales aplicables.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-primary mb-3">
              4. Base Legal
            </h2>
            <p>
              El tratamiento se basa en el consentimiento expreso del usuario al
              enviar el formulario, conforme a la Ley 25.326 de Protección de
              Datos Personales de la República Argentina y normativas
              internacionales aplicables (GDPR cuando corresponda).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-primary mb-3">
              5. Datos provenientes de Meta (Facebook / Instagram)
            </h2>
            <p>
              Cuando el usuario completa un formulario instantáneo (Lead Ad) en
              Facebook o Instagram, Meta nos transfiere los datos que el usuario
              autorizó compartir. CIRE actúa como responsable de dichos datos
              desde el momento en que son recibidos.
            </p>
            <p className="mt-2">
              No utilizamos esos datos para fines distintos a los descritos en
              esta política, no los vendemos ni los cedemos a terceros con fines
              publicitarios.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-primary mb-3">
              6. Compartición con Terceros
            </h2>
            <p>
              Los datos pueden ser procesados por proveedores tecnológicos que
              nos asisten en la operación del sitio y la gestión comercial
              (alojamiento web, CRM, email transaccional, hojas de cálculo y
              WhatsApp Business). Estos proveedores actúan como encargados del
              tratamiento y están obligados contractualmente a proteger la
              información.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-primary mb-3">
              7. Conservación
            </h2>
            <p>
              Conservamos los datos por el tiempo necesario para gestionar la
              relación comercial y cumplir con obligaciones legales. El usuario
              puede solicitar la eliminación en cualquier momento.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-primary mb-3">
              8. Derechos del Usuario
            </h2>
            <p>
              El usuario tiene derecho a acceder, rectificar, actualizar,
              suprimir u oponerse al tratamiento de sus datos personales.
              Para ejercer estos derechos, debe escribir a{" "}
              <a href="mailto:info@cireinmobiliaria.com" className="text-primary hover:underline">
                info@cireinmobiliaria.com
              </a>.
            </p>
            <p className="mt-2">
              También puede solicitar la eliminación de datos obtenidos a través
              de Meta enviando un correo con el asunto "Eliminación de datos —
              Meta".
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-primary mb-3">
              9. Seguridad
            </h2>
            <p>
              Aplicamos medidas técnicas y organizativas razonables para
              proteger los datos contra accesos no autorizados, pérdida o
              alteración. Sin embargo, ningún sistema en internet es 100%
              seguro.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-primary mb-3">
              10. Cookies y Tecnologías de Seguimiento
            </h2>
            <p>
              El sitio puede utilizar cookies propias y de terceros (Meta Pixel,
              Google Analytics) para medir el rendimiento de las campañas
              publicitarias y mejorar la experiencia del usuario. El usuario
              puede deshabilitar las cookies desde la configuración de su
              navegador.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-primary mb-3">
              11. Cambios en la Política
            </h2>
            <p>
              CIRE podrá actualizar esta Política de Privacidad. La versión
              vigente siempre estará publicada en esta URL con la fecha de
              última actualización.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-primary mb-3">
              12. Descargo legal — Cumplimiento con Meta
            </h2>
            <p>
              Este sitio y sus formularios publicitarios cumplen con las{" "}
              <a
                href="https://www.facebook.com/legal/terms/customaudience"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Condiciones de Públicos Personalizados
              </a>{" "}
              y la{" "}
              <a
                href="https://www.facebook.com/legal/terms/dataprocessing"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Política de Datos de Meta Platforms, Inc.
              </a>
            </p>
            <p className="mt-2">
              CIRE no está afiliada, patrocinada ni respaldada por Meta
              Platforms, Inc., Facebook o Instagram. Las marcas Facebook® e
              Instagram® son propiedad de Meta Platforms, Inc.
            </p>
            <p className="mt-2">
              Los datos recolectados a través de los formularios instantáneos
              (Lead Ads) de Meta son utilizados exclusivamente por CIRE para los
              fines indicados en esta política y no se comparten con anunciantes
              externos.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-semibold text-primary mb-3">
              13. Jurisdicción
            </h2>
            <p>
              Esta política se rige por las leyes de la República Argentina.
              Cualquier controversia será sometida a los tribunales ordinarios
              de la Ciudad Autónoma de Buenos Aires.
            </p>
          </section>
        </article>
      </div>
    </main>
  );
};

export default PrivacyPolicy;
