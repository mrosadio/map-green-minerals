// about.js
// Uses Bootstrap modal component — no custom overlay logic needed

export function initAboutModal() {
  console.log('Initializemodel')
  const modalHTML = `
    <div class="modal fade" id="aboutModal" tabindex="-1" 
         aria-labelledby="aboutModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-lg modal-dialog-scrollable">
        <div class="modal-content">
          
          <div class="modal-header border-0 pb-0">
            <h1 class="modal-title fs-4 fw-bold" id="aboutModalLabel">
              Partnerships with African countries in green minerals
            </h1>
            <button type="button" class="btn-close" 
                    data-bs-dismiss="modal" aria-label="Close"></button>
          </div>

          <div class="modal-body pt-2">
            <p class="text-secondary">
              This interactive map and its accompanying report illustrate 
              bilateral and multilateral agreements made with African countries 
              regarding access to their green or critical minerals. These minerals, 
              essential for the energy transition, have become a key focus of 
              geopolitical strategies worldwide in recent years.
            </p>
            <p class="text-secondary">
              The strategic importance of critical minerals is increasing alongside 
              intensifying geopolitical competition over future markets for green 
              energy products. Multilateral and bilateral agreements between states 
              regarding the production, access and processing of critical minerals 
              are on the rise.
            </p>
            <p class="text-secondary">
              Information about these partnerships is not always publicly available,
              and their broader implications remain unclear. To address this gap, 
              APRI conducted an extensive online search using multiple search engines 
              and databases. The search encompassed G20 and BRICS+ member states, as well 
              as states with significant mining sectors, such as Chile, Cuba and Venezuela. 
              Although this search yielded a significant number of partnerships, 
              it is not exhaustive. The map and accompanying information will be updated regularly 
              as knowledge of these partnerships expands.
            </p>

            <p class="text-secondary">
              Data collected by APRI's Geopolitics and Geoeconomics Program team 
              from primary sources including government databases, official treaty 
              repositories, and secondary sources.
            </p>

            <div class="row mt-4">
              <div class="col-md-6">
                <p class="text-uppercase text-secondary small mb-1" 
                   style="letter-spacing:0.08em;">Publication</p>
                <p class="text-secondary small">
                  Produced under the supervision of APRI's Geopolitics and 
                  Geoeconomics Program team.
                </p>
              </div>
              <div class="col-md-6">
                <p class="text-uppercase text-secondary small mb-1"
                   style="letter-spacing:0.08em;">Code</p>
                <a href="https://github.com/mrosadio/map-climate-diplomacy"
                   target="_blank" class="small">
                  github.com/mrosadio/map-climate-diplomacy
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  `;

  // Inject once into the DOM
  document.body.insertAdjacentHTML("beforeend", modalHTML);
}

// export function openAboutModal() {
//   const modal = bootstrap.Modal.getOrCreateInstance(
//     document.getElementById("#aboutModal")
//   );
//   modal.show();
// }