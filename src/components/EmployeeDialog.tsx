
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface EmployeeDialogProps {
  open: boolean;
  mode: "add" | "edit";
  employee?: any;
  onClose: () => void;
  onSave: (data: any) => void;
}

export const EmployeeDialog: React.FC<EmployeeDialogProps> = ({
  open,
  mode,
  employee,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    empId: "",
    position: "",
    department: "Sales",
    hireDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (mode === "edit" && employee) {
      setFormData(employee);
    } else if (mode === "add") {
      setFormData({
        name: "",
        empId: "EMP" + Math.floor(1000 + Math.random() * 9000),
        position: "",
        department: "Sales",
        hireDate: new Date().toISOString().split("T")[0],
      });
    }
  }, [open, mode, employee]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSelectChange = (key: string, value: string) => {
    setFormData({ ...formData, [key]: value });
  };

  const handleSubmit = () => {
    if (!formData.name?.trim()) return;
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-2xl"> {/* Expand width */}
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit Employee" : "Add New Employee"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update the employee details and save changes."
              : "Enter the details for the new employee."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="empId" className="text-right">
              Employee ID
            </Label>
            <Input
              id="empId"
              value={formData.empId}
              onChange={handleInputChange}
              className="col-span-3"
              readOnly={mode === "edit"}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Full Name
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={handleInputChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="position" className="text-right">
              Position
            </Label>
            <Select
              value={formData.position}
              onValueChange={(value) => handleSelectChange("position", value)}
            >
              <SelectTrigger id="position" className="col-span-3">
                <SelectValue placeholder="Select position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Sales Manager">Sales Manager</SelectItem>
                <SelectItem value="Sales Representative">Sales Representative</SelectItem>
                <SelectItem value="Sales Assistant">Sales Assistant</SelectItem>
                <SelectItem value="Regional Sales Manager">Regional Sales Manager</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="department" className="text-right">
              Department
            </Label>
            <Select
              value={formData.department}
              onValueChange={(value) => handleSelectChange("department", value)}
            >
              <SelectTrigger id="department" className="col-span-3">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Sales">Sales</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
                <SelectItem value="Executive">Executive</SelectItem>
                <SelectItem value="Customer Support">Customer Support</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="hireDate" className="text-right">
              Hire Date
            </Label>
            <Input
              id="hireDate"
              type="date"
              value={formData.hireDate}
              onChange={handleInputChange}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {mode === "edit" ? "Save Changes" : "Add Employee"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
