  import React from 'react';
  import { Dialog, DialogHeader, DialogBody, DialogFooter, Button, Typography } from '@material-tailwind/react';
  import { ExclamationCircleIcon, CheckCircleIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

  const NotificationDialog = ({ open, setOpen, message, isWarning, isError, isConfirmation, onConfirm, onCancel }) => {
    let icon;

    if (isError) {
      icon = <ExclamationCircleIcon className="h-6 w-6 text-red-500" />;
    } else if (isConfirmation) {
      icon = <QuestionMarkCircleIcon className="h-6 w-6 text-orange-500" />;
    } else if (isWarning) {
      icon = <ExclamationCircleIcon className="h-6 w-6 text-yellow-500" />;
    } else {
      icon = <CheckCircleIcon className="h-6 w-6 text-green-500" />;
    }

    return (
      <Dialog open={open} handler={() => setOpen(false)} size="sm">
        <DialogHeader className="font-poppins">
          {isError ? "Error" : isConfirmation ? "Confirmation" : isWarning ? "Warning" : "Notification" }
        </DialogHeader>
        <DialogBody divider>
          <div className="flex items-center gap-2">
            {icon}
            <Typography className="font-poppins font-normal text-blue-gray-700">{message}</Typography>
          </div>
        </DialogBody>
        <DialogFooter>
          {onCancel && (
            <Button
              variant="text"
              color="red"
              onClick={() => {
                setOpen(false);
                onCancel && onCancel();
              }}
              className="mr-2"
            >
              <span className="font-poppins font-semibold">Cancel</span>
            </Button>
          )}
          {onConfirm && (
            <Button
              variant="gradient"
              color="green"
              onClick={() => {
                setOpen(false);
                onConfirm && onConfirm();
              }}
            >
              <span className="font-poppins font-semibold">Confirm</span>
            </Button>
          )}
        </DialogFooter>
      </Dialog>
    );
  };

  export default NotificationDialog;
