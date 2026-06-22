import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DataGrid } from "@/components/ui/data-grid";

describe("DataGrid", () => {
  it("renders column headers", () => {
    render(<DataGrid rows={[{ name: "Concrete" }]} columns={[{ key: "name", header: "Name", cell: (row) => row.name }]} />);
    expect(screen.getByText("Name")).toBeInTheDocument();
  });
});
