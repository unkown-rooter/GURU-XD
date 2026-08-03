import { BaseDao } from "./BaseDao";
import { SimulatedFile } from "../db";
import { PaginationOptions, PaginatedResult } from "./types";
import { FileSchema, validateWithSchema, validatePartialWithSchema } from "./schemas";

export class FileDao extends BaseDao<SimulatedFile> {
  constructor() {
    super("files", "File");
  }

  protected override validateItem(file: Partial<SimulatedFile>, isUpdate: boolean = false): any {
    super.validateItem(file, isUpdate);
    if (isUpdate) {
      return validatePartialWithSchema(FileSchema, file, "File");
    } else {
      return validateWithSchema(FileSchema, file, "File");
    }
  }

  /**
   * Find file by exact virtual path
   */
  public findByPath(filePath: string): SimulatedFile | null {
    if (!filePath) return null;
    return this.findOne((file) => file.path.toLowerCase() === filePath.toLowerCase());
  }

  /**
   * List files in specific directory
   */
  public listDirectory(directoryPath: string): SimulatedFile[] {
    const cleanDir = directoryPath.endsWith("/") ? directoryPath : `${directoryPath}/`;
    return this.getCollection().filter((file) => file.path.startsWith(cleanDir) || file.path === directoryPath);
  }

  /**
   * Search files by filename or path keyword
   */
  public searchFiles(query: string, pagination?: PaginationOptions): PaginatedResult<SimulatedFile> {
    return this.findAll(
      {
        search: query,
        searchFields: ["name", "path", "content"]
      },
      pagination
    );
  }
}
