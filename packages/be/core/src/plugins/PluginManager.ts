import { Express } from 'express';
import { Logger } from '../logging/Logger';
import { Plugin } from './Plugin';
import { PluginConfig } from '../types';

export interface PluginRegistration {
  plugin: Plugin;
  config?: PluginConfig;
  enabled?: boolean;
}

export class PluginManager {
  private plugins: Map<string, PluginRegistration> = new Map();
  private loadOrder: string[] = [];
  private logger: Logger;

  constructor(logger?: Logger) {
    this.logger = logger || Logger.create({ level: 'info' });
  }

  /**
   * Register a plugin with optional configuration
   */
  register(plugin: Plugin, config?: PluginConfig, enabled = true): this {
    if (this.plugins.has(plugin.name)) {
      this.logger.warn(
        `Plugin ${plugin.name} is already registered. Skipping.`
      );
      return this;
    }

    this.plugins.set(plugin.name, {
      plugin,
      config,
      enabled,
    });

    this.logger.debug(`Plugin registered: ${plugin.name}@${plugin.version}`);
    return this;
  }

  /**
   * Get a registered plugin by name
   */
  get(name: string): Plugin | undefined {
    const registration = this.plugins.get(name);
    return registration?.enabled ? registration.plugin : undefined;
  }

  /**
   * Check if a plugin is registered and enabled
   */
  has(name: string): boolean {
    const registration = this.plugins.get(name);
    return Boolean(registration?.enabled);
  }

  /**
   * Enable a plugin
   */
  enable(name: string): boolean {
    const registration = this.plugins.get(name);
    if (registration) {
      registration.enabled = true;
      this.logger.info(`Plugin enabled: ${name}`);
      return true;
    }
    this.logger.warn(`Cannot enable plugin ${name}: not found`);
    return false;
  }

  /**
   * Disable a plugin
   */
  disable(name: string): boolean {
    const registration = this.plugins.get(name);
    if (registration) {
      registration.enabled = false;
      this.logger.info(`Plugin disabled: ${name}`);
      return true;
    }
    this.logger.warn(`Cannot disable plugin ${name}: not found`);
    return false;
  }

  /**
   * Get list of all registered plugins
   */
  list(): { name: string; version: string; enabled: boolean }[] {
    return Array.from(this.plugins.entries()).map(([name, registration]) => ({
      name,
      version: registration.plugin.version,
      enabled: registration.enabled || false,
    }));
  }

  /**
   * Sort plugins by their dependencies to determine load order
   */
  private calculateLoadOrder(): string[] {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const order: string[] = [];

    const visit = (pluginName: string): void => {
      if (visited.has(pluginName)) return;
      if (visiting.has(pluginName)) {
        throw new Error(
          `Circular dependency detected involving plugin: ${pluginName}`
        );
      }

      const registration = this.plugins.get(pluginName);
      if (!registration?.enabled) return;

      visiting.add(pluginName);

      // Visit dependencies first
      const dependencies = registration.plugin.dependencies || [];
      for (const dep of dependencies) {
        if (!this.plugins.has(dep)) {
          throw new Error(
            `Plugin ${pluginName} depends on ${dep}, but ${dep} is not registered`
          );
        }
        visit(dep);
      }

      visiting.delete(pluginName);
      visited.add(pluginName);
      order.push(pluginName);
    };

    // Visit all enabled plugins
    for (const [name, registration] of this.plugins) {
      if (registration.enabled) {
        visit(name);
      }
    }

    return order;
  }

  /**
   * Initialize all registered and enabled plugins in dependency order
   */
  async initializeAll(app: Express): Promise<void> {
    try {
      this.loadOrder = this.calculateLoadOrder();
      this.logger.info(
        `Initializing ${
          this.loadOrder.length
        } plugins in order: ${this.loadOrder.join(', ')}`
      );

      for (const pluginName of this.loadOrder) {
        const registration = this.plugins.get(pluginName);
        if (!registration?.enabled) continue;

        const { plugin, config } = registration;

        try {
          this.logger.info(
            `Initializing plugin: ${plugin.name}@${plugin.version}`
          );
          await plugin.register(app, config || {});
          this.logger.info(`Plugin initialized successfully: ${plugin.name}`);
        } catch (error) {
          this.logger.error(error as Error, {
            context: 'PluginManager.initializeAll',
            plugin: plugin.name,
            version: plugin.version,
          });

          // Decide whether to continue or fail fast based on plugin criticality
          // For now, we'll continue with other plugins but log the failure
          this.logger.warn(
            `Continuing with remaining plugins after ${plugin.name} failed to initialize`
          );
        }
      }

      this.logger.info(
        `Plugin initialization completed. ${this.loadOrder.length} plugins processed.`
      );
    } catch (error) {
      this.logger.error(error as Error, {
        context: 'PluginManager.initializeAll',
      });
      throw error;
    }
  }

  /**
   * Get the load order of plugins (useful for debugging)
   */
  getLoadOrder(): string[] {
    return [...this.loadOrder];
  }

  /**
   * Clear all registered plugins
   */
  clear(): void {
    this.plugins.clear();
    this.loadOrder = [];
    this.logger.debug('All plugins cleared from manager');
  }
}
