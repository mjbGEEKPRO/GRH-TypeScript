import React, { useState } from "react";
import { toast } from "react-toastify";
import Modal from "./Modal";
import Button from "../Button/ButtonDelete";

interface Props {
  show: boolean;
  handleCloseModal: () => void;
  handleConfirm: () => void;
}

export default function ConfirmModalDelete({
  show,
  handleCloseModal = () => {},
  handleConfirm = () => {},
}: Props) {
  if (show == false) return null;

  return (
    <Modal show={show} onClose={handleCloseModal}>
      <div className="">
        {/* header modal */}
        <div className="border-b border-stroke py-4 px-7 dark:border-strokedark">
          <h3 className="text-lg font-bold text-black dark:text-white">
            Delete Confirmation
          </h3>
        </div>

        {/* content modal */}
        <div className="p-7">
          <p className="text-medium  text-black dark:text-white">
            Would you really like to delete this item ?
          </p>
        </div>

        {/* footer modal */}
        <div className="flex justify-end gap-4.5 p-7">
          <Button variant="outline" action={handleCloseModal}>
            Cancel
          </Button>
          <Button variant="danger" type="submit" action={handleConfirm}>
            Confirm Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
}
