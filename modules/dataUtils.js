export async function loadAndMergeData(
  geojsonUrl,
  jsonFilePath,
  noPartnerFilePath
) {
  try {
    // Load GeoJSON from the provided URL
    const geojsonResponse = await fetch(geojsonUrl);
    const geojsonData = await geojsonResponse.json();

    // Load the local JSON file
    const jsonResponse = await fetch(jsonFilePath);
    const jsonData = await jsonResponse.json();

    // Load partnership no. JSON file
    const numberjsonResponse = await fetch(noPartnerFilePath);
    const nojsonData = await numberjsonResponse.json();

    // Create a Map to hold the partnership data by country
    const partnershipMap = new Map();
    const centerMap = new Map();
    const zoomMap = new Map();
    const partnersNoMap = new Map();

    // Map each bilateral partnership in a object
    jsonData.forEach((partner) => {
      //console.log('Partner in Json raw data', partner);
      let nonAfricanPartner;
      if (typeof partner.nonafrican === "object") {
        nonAfricanPartner = partner.nonafrican.name;
      } else {
        nonAfricanPartner = partner.nonafrican;
      }

      // Change "United Kingdom" to "England"
      if (nonAfricanPartner === "United Kingdom") {
        nonAfricanPartner = "England";
      }

      partner.partnership.forEach((p) => {
        if (partnershipMap.has(nonAfricanPartner)) {
          partnershipMap.get(nonAfricanPartner).push(p.country);
        } else {
          partnershipMap.set(nonAfricanPartner, [p.country]);
        }
      });
    });
    console.log("partnership map", partnershipMap);

    jsonData.forEach((partner) => {
      if (partner.center) {
        centerMap.set(partner.nonafrican, partner.center);
      }
    });
    jsonData.forEach((partner) => {
      if (partner.zoom) {
        zoomMap.set(partner.nonafrican, partner.zoom);
      }
    });
    //console.log("JSON data", jsonData);
    nojsonData.forEach((entry) => {
      partnersNoMap.set(entry.africanCountry, entry.partnersNo);
    });
    geojsonData.features.forEach((feature) => {
      const countryName = feature.properties.name;
      if (partnershipMap.has(countryName)) {
        feature.properties.partners = partnershipMap.get(countryName);
      }
      feature.properties.center = centerMap.get(countryName);
      feature.properties.zoom = zoomMap.get(countryName);
      if (partnersNoMap.has(countryName)) {
        feature.properties.partnersNo = partnersNoMap.get(countryName);
      }
    });
    return { geojsonData, jsonData, nojsonData, partnershipMap };
  } catch (error) {
    //console.error("Error loading or merging data:", error);
    return null;
  }
}

export async function mergeMulti(geojsonUrl, multiJsonFilePath) {
  try {
    const geojsonResponse = await fetch(geojsonUrl);
    const geojsonMultiData = await geojsonResponse.json();

    const multiJsonResponse = await fetch(multiJsonFilePath);
    const multiJsonData = await multiJsonResponse.json();

    const blocToMembersMap = new Map();
    //console.log("Multijson data", multiJsonData);
    multiJsonData.forEach((partner) => {
      const blocName = partner.blocName;
      //console.log("bloc name", blocName);
      if (!blocToMembersMap.has(blocName)) {
        blocToMembersMap.set(blocName, []);
      }
      if (typeof partner.members === "object") {
        for (let key in partner.members) {
          if (Array.isArray(partner.members[key])) {
            partner.members[key].forEach((item) => {
              blocToMembersMap.get(blocName).push(item);
            });
          }
        }
      } else {
        partner.members.forEach((member) => {
          //console.log("Member", member);
          if (!blocToMembersMap.get(blocName).includes(member)) {
            blocToMembersMap.get(blocName).push(member);
          }
        });
      }
    });
    geojsonMultiData.features.forEach((feature) => {
      const countryName = feature.properties.name;
      feature.properties.blocs = [];
      blocToMembersMap.forEach((members, blocName) => {
        if (members.includes(countryName)) {
          feature.properties.blocs.push(blocName);
        }
      });
    });
    return { geojsonMultiData, multiJsonData };
  } catch (error) {
    //console.error("Error loading or merging data:", error);
    return null;
  }
}

export async function createBlocGeoJSON(
  geojsonUrl,
  multiJsonFilePath,
  targetBlocName,
  euGeojsonPath
) {
  console.log("====== createBlocGeoJSON CALLED ======");
  console.log("targetBlocName:", targetBlocName);
  console.log("euGeojsonPath:", euGeojsonPath);
  try {
    const geojsonResponse = await fetch(geojsonUrl);
    const geojsonData = await geojsonResponse.json();

    const multiJsonResponse = await fetch(multiJsonFilePath);
    const multiJsonData = await multiJsonResponse.json();

    let targetMembers = [];
    let hasEUKey = false;
    let euCountries = [];
    let explicitCountries = [];
    
    multiJsonData.forEach((bloc) => {
      if (bloc.blocName === targetBlocName) {
        console.log("Found bloc:", targetBlocName);
        console.log("Type of bloc members", typeof bloc.members);
        if (Array.isArray(bloc.members)) {
          targetMembers = bloc.members;
        } else {
          console.log("bloc members structure:", bloc.members);
          
          // First, collect countries from "countries" array
          if (bloc.members.countries) {
            explicitCountries = bloc.members.countries;
          }
          
          // Add all members
          for (let key in bloc.members) {
            console.log("Processing key:", key);
            if (key === "EU") {
              // Track that EU exists for loading EU GeoJSON
              hasEUKey = true;
              euCountries = bloc.members.EU;
              targetMembers.push("EU");
              // Only add EU countries that are ALSO in the explicit countries array
              bloc.members.EU.forEach((item) => {
                if (explicitCountries.includes(item)) {
                  targetMembers.push(item);
                }
              });
              console.log("Found EU key! Added EU and explicitly mentioned EU countries to targetMembers");
            } else if (bloc.members[key]) {
              bloc.members[key].forEach((item) => {
                targetMembers.push(item);
              });
            }
          }
        }
      }
    });
    
    console.log("hasEUKey:", hasEUKey);
    console.log("targetMembers:", targetMembers);
    
    // Load EU GeoJSON and add it to the world data if EU key exists
    if (hasEUKey && euGeojsonPath) {
      console.log("Loading EU GeoJSON from:", euGeojsonPath);
      try {
        const euResponse = await fetch(euGeojsonPath);
        const euData = await euResponse.json();
        console.log("EU GeoJSON loaded:", euData);
        // Add EU feature to the world GeoJSON
        if (euData.features && euData.features.length > 0) {
          geojsonData.features.push(euData.features[0]);
          console.log("Added EU feature to geojsonData. EU feature name:", euData.features[0].properties.name);
        }
      } catch (euError) {
        console.error("Could not load EU GeoJSON:", euError);
      }
    } else {
      console.log("Not loading EU GeoJSON. hasEUKey:", hasEUKey, "euGeojsonPath:", euGeojsonPath);
    }
    
    const filteredFeatures = geojsonData.features.filter((feature) => {
      return targetMembers.includes(feature.properties.name);
    });
    console.log("Filtered features count:", filteredFeatures.length);
    console.log("Filtered features names:", filteredFeatures.map(f => f.properties.name));
    //console.log("Target members", targetMembers);
    // Create a new GeoJSON object with the filtered features
    const filteredGeoJSON = {
      type: "FeatureCollection",
      features: filteredFeatures,
    };
    return filteredGeoJSON;
  } catch (error) {
    //console.error("Error creating bloc GeoJSON:", error);
    return null;
  }
}

export function filterAfrica(geojsonData, partnersNoData) {
  // console.log(geojsonData);

  // console.log(partnersNoData);
  const africanCountries = partnersNoData.map(
    (countryData) => countryData.africanCountry
  );
  //console.log(africanCountries); // lista de todos los paises a marcar, si sale Guinea Bisseau

  const filteredFeatures = geojsonData.features.filter((feature) => {
    const countryName = feature.properties.name;
    //   console.log(countryName);

    if (countryName == "Algeria") {
      // console.log("esta");
      //console.log(countryName);
      //console.log(africanCountries.includes(countryName));
    } else {
      //console.log( "no esta" + countryName)
    }

    return africanCountries.includes(countryName);
  });
  // console.log(filteredFeatures);

  return { ...geojsonData, features: filteredFeatures };
}

export function filterCountriesByPartner(mergedBiData, selectedCountry) {
  console.log('Merged Bi data in filterCountriesByPartner', mergedBiData)
  console.log("Selected country in function filterCountriesByPartner", selectedCountry);
  if (selectedCountry === "United Kingdom") {
    selectedCountry = "England"; // since the geojson calls it England
  }
  const selectedCountryFeature = mergedBiData.features.find(
    (feature) => feature.properties.name === selectedCountry
  );
  console.log("Selected country", selectedCountryFeature);
  const partners = selectedCountryFeature.properties.partners || [];
  const filteredGeoJSON = {
    type: "FeatureCollection",
    features: mergedBiData.features.filter(
      (feature) =>
        feature.properties.name === selectedCountry ||
        partners.includes(feature.properties.name)
    ),
  };
  //console.log("Filtered GeoJSON is now:", filteredGeoJSON);
  return filteredGeoJSON;
}

export async function filterEUandPartners(geojsonData, jsonData) {
  const eu = jsonData[0];
  const euContries = eu.nonafrican.countries;
  const euPartners = eu.partnership.map((partner) => partner.country);
  const euPartnership = euContries.concat(euPartners);
  //console.log("eu partnership", euPartnership);
  const filteredFeatures = geojsonData.features.filter((feature) => {
    return euPartnership.includes(feature.properties.name);
  });
  const filteredGeoJSON = {
    type: "FeatureCollection",
    features: filteredFeatures,
  };
  //console.log("Filter EU partners", filteredGeoJSON);
  return filteredGeoJSON;
}



