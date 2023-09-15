import { formatAddress } from "./Functions";

export const CopyAddress = ({ accountSelectedAddress }) => {
  return (
    <>
      <button
        id="CopyAddressButton"
        onClick={function () {
          navigator.clipboard.writeText(accountSelectedAddress);
        }}
      >
        {formatAddress(accountSelectedAddress)} 📋
      </button>
    </>
  );
};
