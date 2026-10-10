
export async function loadAndMergeData(
  worldGeoJSON,
  jsonFilePath,
  noPartnerFilePath
) {
  try {
    const jsonResponse = await fetch(jsonFilePath);
    const jsonData = await jsonResponse.json();

    const numberjsonResponse = await fetch(noPartnerFilePath);
    const nojsonData = await numberjsonResponse.json();

    // Create a Map to hold the partnership data by country
    const partnershipMap = new Map();
    const partnersNoMap = new Map();

    // Map each bilateral partnership in a object
    jsonData.forEach((partner) => {
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
    nojsonData.forEach((entry) => {
      partnersNoMap.set(entry.africanCountry, entry.partnersNo);
    });

    // build new feature objects instead of mutation worldgeojsonin place
    // worldgeojson is shared with mergeMulti and createBlocGeoJSON
    // mutating here would leak bilateral-only properties into those
    const mergedFeatures = worldGeoJSON.features.map((feature) => {
      const countryName = feature.properties.name;
      return {
        ...feature,
        properties: {
          ...feature.properties,
          partners: partnershipMap.get(countryName),
          partnersNo: partnersNoMap.get(countryName),
        },
      };
    });

    const geojsonData = { ...worldGeoJSON, features: mergedFeatures };

    return { geojsonData, jsonData, nojsonData, partnershipMap };
  } catch (error) {
    console.error("loadAndMergeData failed:", error);
    return null;
  }
}

export async function mergeMulti(worldGeoJSON, multiJsonFilePath) {
  try {
    const multiJsonResponse = await fetch(multiJsonFilePath);
    const multiJsonData = await multiJsonResponse.json();

    // blocName -> set of member country names
    // a set ,not array, makes membership checks below o(1) (instead of o(n))
    const blocToMembersMap = new Map();
    multiJsonData.forEach((partner) => {
      const blocName = partner.blocName;
      if (!blocToMembersMap.has(blocName)) {
        blocToMembersMap.set(blocName, new Set());
      }
      const members = blocToMembersMap.get(blocName);

      if (typeof partner.members === "object" && !Array.isArray(partner.members)) {
        for (let key in partner.members) {
          if (Array.isArray(partner.members[key])) {
            partner.members[key].forEach((item) => members.add(item));
          }
        }
      } else {
        partner.members.forEach((member) => members.add(member));
      }
    });
    // Reverse index: countryName -> [blocNames]. Built once, O(total bloc
    // memberships) rather than re-scanning every bloc for every feature
    // (which was the o(features × blocs × members) shape in the original)
    const countryToBlocs = new Map();
    blocToMembersMap.forEach((members, blocName) => {
      members.forEach((countryName) => {
        if (!countryToBlocs.has(countryName)) {
          countryToBlocs.set(countryName, []);
        }
        countryToBlocs.get(countryName).push(blocName);
      });
    });
    const mergedFeatures = worldGeoJSON.features.map((feature) => {
      const countryName = feature.properties.name;
      return {
        ...feature,
        properties: {
          ...feature.properties,
          blocs: countryToBlocs.get(countryName) || [],
        },
      };
    });

    const geojsonMultiData = { ...worldGeoJSON, features: mergedFeatures };
    return { geojsonMultiData, multiJsonData };
  } catch (error) {
    console.error("mergeMulti failed:", error);
    return null;
  }
}

export async function createBlocGeoJSON(worldGeoJSON, multiJsonFilePath, targetBlocName, euGeojsonPath) {
  try {
    const multiJsonResponse = await fetch(multiJsonFilePath);
    const multiJsonData = await multiJsonResponse.json();

    let targetMembers = [];
    let hasEUKey = false;
    let explicitCountries = [];
    
    multiJsonData.forEach((bloc) => {
      if (bloc.blocName === targetBlocName) {
        if (Array.isArray(bloc.members)) {
          targetMembers = bloc.members;
        } else {        
          if (bloc.members.countries) {
            explicitCountries = bloc.members.countries;
          }
          for (let key in bloc.members) {
            if (key === "EU") {
              hasEUKey = true;
              targetMembers.push("EU");
              bloc.members.EU.forEach((item) => {
                if (explicitCountries.includes(item)) {
                  targetMembers.push(item);
                }
              });
            } else if (bloc.members[key]) {
              bloc.members[key].forEach((item) => {
                targetMembers.push(item);
              });
            }
          }
        }
      }
    });

    // Copy the features array before mutating - worldGeoJSON is shared
    // across all consumers, so pushing the EU feature directly onto
    // worldGeoJSON.features would leak it permanently into every other view
    let features = [...worldGeoJSON.features];
    
    if (hasEUKey && euGeojsonPath) {
      try {
        const euResponse = await fetch(euGeojsonPath);
        const euData = await euResponse.json();
        if (euData.features && euData.features.length > 0) {
          features.push(euData.features[0]);
        }
      } catch (euError) {
        console.error("Could not load EU GeoJSON:", euError);
      }
    }
    // Set for O(1) membership checks instead of .includes() (O(n)) inside filter.
    const targetSet = new Set(targetMembers);
    const filteredFeatures = features.filter((feature) => targetSet.has(feature.properties.name));
    const filteredGeoJSON = {
      type: "FeatureCollection",
      features: filteredFeatures,
    };
    return filteredGeoJSON;
  } catch (error) {
    console.error("createBlocGeoJSON failed:", error);
    return null;
  }
}
export function filterCountriesByPartner(mergedBiData, selectedCountry) {
  if (selectedCountry === "United Kingdom") {
    selectedCountry = "England";
  }
  const selectedCountryFeature = mergedBiData.features.find((feature) => feature.properties.name === selectedCountry);
  // Set for O(1) membership checks instead of .includes() (O(n)) inside filter
  const partnerSet = new Set(selectedCountryFeature.properties.partners || []);
  const filteredGeoJSON = {
    type: "FeatureCollection",
    features: mergedBiData.features.filter(
      (feature) => feature.properties.name === selectedCountry || partnerSet.has(feature.properties.name)
    ),
  };
  return filteredGeoJSON;
}

export async function filterEUandPartners(geojsonData, jsonData) {
  const eu = jsonData[0];
  const euContries = eu.nonafrican.countries;
  const euPartners = eu.partnership.map((partner) => partner.country);
  // Set for O(1) membership checks instead of .includes() (O(n)) inside filter
  const euPartnershipSet = new Set([...euContries, ...euPartners]);
  const filteredFeatures = geojsonData.features.filter((feature) => euPartnershipSet.has(feature.properties.name));
  const filteredGeoJSON = {
    type: "FeatureCollection",
    features: filteredFeatures,
  };
  return filteredGeoJSON;
}
