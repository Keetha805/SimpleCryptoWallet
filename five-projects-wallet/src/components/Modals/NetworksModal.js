import { useEffect, useState } from "react";
import { getNetworks, getNetworkSelected, fetchBackend } from "../Functions";

export const NetworksModal = ({ setNetworkSelectedExternal }) => {
  const [showNetworksModal, setShowNetworksModal] = useState(false);
  const [showDeleteNetworkModal, setShowDeleteNetworkModal] = useState(false);
  const [networkToDelete, setNetworkToDelete] = useState("");

  const handleShowNetworksModal = () => {
    setShowNetworksModal(true);
    setShowDeleteNetworkModal(false);
  };

  const buildNetworksList = async () => {
    const networksJson = await getNetworks();
    const networksDiv = document.getElementById("NetworksList");

    const fragment = document.createDocumentFragment();
    for (let networkName in networksJson) {
      const networkObj = networksJson[networkName];
      const divContenedor = document.createElement("div");
      const div = document.createElement("div");
      const spanIcon = document.createElement("span");
      const spanNetworkName = document.createElement("span");

      divContenedor.id = networkName;

      div.className = "divHover";
      div.onclick = function () {
        setNetworkSelected(networkObj);
        closeModals();
      };

      spanIcon.textContent = networkName.charAt(0).toUpperCase() + "---";
      spanNetworkName.textContent = networkName;

      div.appendChild(spanIcon);
      div.appendChild(spanNetworkName);
      divContenedor.appendChild(div);

      if (networkName !== "mainnet") {
        const buttonDeleteNetwork = document.createElement("button");
        buttonDeleteNetwork.textContent = "🗑️";
        buttonDeleteNetwork.onclick = async function () {
          setNetworkToDelete(networkName);
          setShowNetworksModal(false);
          setShowDeleteNetworkModal(true);
        };
        divContenedor.appendChild(buttonDeleteNetwork);
      }

      fragment.appendChild(divContenedor);
    }
    networksDiv.innerHTML = "";
    networksDiv.appendChild(fragment);

    return true;
  };

  const deleteNetwork = async () => {
    const { newNetworkSelected } = await fetchBackend(
      "/deleteNetwork",
      "POST",
      {
        networkToDelete: networkToDelete,
      }
    );
    document.getElementById("NetworkSelect").textContent = newNetworkSelected;
    setNetworkToDelete("");
    setShowDeleteNetworkModal(false);
  };

  const closeModals = () => {
    setShowNetworksModal(false);
    setShowDeleteNetworkModal(false);
  };

  const setNetworkSelected = async (newNetworkSelected) => {
    await fetchBackend("/setNetworkSelected", "POST", {
      newNetworkSelected: newNetworkSelected,
    });
    document.getElementById("NetworkSelect").textContent =
      newNetworkSelected.chainName;
    setNetworkSelectedExternal(newNetworkSelected);
  };

  useEffect(() => {
    if (showNetworksModal) {
      setShowNetworksModal(true);
      setShowDeleteNetworkModal(false);
      buildNetworksList();
    }
  }, [showNetworksModal]);

  const initializeNetworkModal = async () => {
    const networkSelected = await getNetworkSelected();
    document.getElementById("NetworkSelect").textContent =
      networkSelected.chainName;
    setNetworkSelectedExternal(networkSelected);
  };

  useEffect(() => {
    initializeNetworkModal();
  }, []);

  return (
    <>
      <button onClick={handleShowNetworksModal} id="NetworkSelect"></button>

      <div id="NetworksModal" hidden={!showNetworksModal}>
        <h3>
          Select network
          <button onClick={closeModals}>X</button>
        </h3>
        <div id="NetworksList"></div>
        <button type="checkbox">Mostrar redes de prueba</button>
        <br></br>
        <button>Agregar red</button>
      </div>

      <div id="deleteNetworkModal" hidden={!showDeleteNetworkModal}>
        <h3>¿Eliminar red?</h3>
        <p>¿Está seguro de que quiere eliminar esta red?</p>
        <button onClick={closeModals}>Cancelar</button>
        <button onClick={deleteNetwork}>Eliminar</button>
      </div>
    </>
  );
};
